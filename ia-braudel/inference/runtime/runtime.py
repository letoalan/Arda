import os
import json
import urllib.request
import urllib.error
from prompts.templates import SYSTEM_PROMPT, TOLKIEN_SYSTEM_PROMPT
from inference.repair.repair_engine import pipeline_parse_repair_validate
from schemas.validation import ValidationError

class BaseLLMAdapter:
    def generate(self, prompt: str) -> str:
        raise NotImplementedError

class MockLLMAdapter(BaseLLMAdapter):
    """Mock LLM adapter returning pre-configured valid JSON responses for testing."""
    def __init__(self, responses=None):
        self.responses = responses or {}

    def generate(self, prompt: str) -> str:
        # Default mock fallback
        return json.dumps({
            "task": "world_seed",
            "confidence": 1.0,
            "items": [
                {
                    "name": "Mock Empire",
                    "description": "Un empire généré par le mock",
                    "worldType": "real"
                }
            ],
            "warnings": []
        })

class OllamaLLMAdapter(BaseLLMAdapter):
    """Adapter to connect to a local Ollama server running at localhost:11434."""
    def __init__(self, model="qwen2.5-coder:7b", base_url="http://localhost:11434"):
        self.model = model
        self.base_url = base_url

    def generate(self, prompt: str) -> str:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.0  # Greedy search for deterministic structured outputs
            }
        }
        
        req = urllib.request.Request(
            url, 
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                return res_data.get("response", "")
        except urllib.error.URLError as e:
            # Return an irreparable corrupted format so that repair pipeline triggers structured refusal
            raise ValidationError(f"Ollama server connection failed: {str(e)}")

class LMStudioLLMAdapter(BaseLLMAdapter):
    """Adapter to connect to a local LM Studio server running at localhost:1234."""
    def __init__(self, model="qwen2.5-coder-7b-instruct", base_url="http://localhost:1234"):
        self.model = model
        self.base_url = base_url

    def generate(self, prompt: str) -> str:
        # LM Studio exposes OpenAI-like Chat Completions at /v1/chat/completions
        url = f"{self.base_url}/v1/chat/completions"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.0,
            "stream": False
        }
        
        req = urllib.request.Request(
            url, 
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                choices = res_data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "")
                return ""
        except urllib.error.URLError as e:
            raise ValidationError(f"LM Studio server connection failed: {str(e)}")

class BraudelIARuntime:
    """Core runtime class orchestrating prompt engineering, LLM query, repair and validation."""
    def __init__(self, adapter: BaseLLMAdapter):
        self.adapter = adapter

    def execute(self, task: str, instruction: str, context: dict = None, creative_mode: bool = False) -> dict:
        context = context or {}
        
        # Select system prompt
        sys_prompt = TOLKIEN_SYSTEM_PROMPT if creative_mode else SYSTEM_PROMPT
        
        # Build prompt
        prompt = f"{sys_prompt}\n\nTask: {task}\nInstruction: {instruction}\nContext: {json.dumps(context)}\nOutput JSON:\n"
        
        try:
            raw_output = self.adapter.generate(prompt)
            # Run parse -> repair -> validate pipeline
            return pipeline_parse_repair_validate(raw_output, expected_task=task, creative_mode=creative_mode)
        except Exception as e:
            # Return structured refusal
            return {
                "task": task,
                "confidence": 0.0,
                "items": [],
                "warnings": [f"Execution failed: {str(e)}"]
            }
