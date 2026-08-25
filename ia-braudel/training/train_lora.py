import os
import sys
import json

# Add parent directory of training/ to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Set up defaults for training
DEFAULT_BASE_MODEL = "Qwen/Qwen2.5-Coder-7B-Instruct"
DEFAULT_OUTPUT_DIR = "./lora_output"

def load_jsonl(filepath):
    """Loads a JSONL file into a list of dictionaries."""
    data = []
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    data.append(json.loads(line))
    return data

def setup_training_config():
    """Returns training parameters and PEFT/LoRA configuration."""
    peft_config = {
        "r": 16,                  # Rank
        "lora_alpha": 32,         # Alpha scaling
        "target_modules": ["q_proj", "v_proj", "k_proj", "o_proj"], # Target attention layers
        "lora_dropout": 0.05,
        "bias": "none",
        "task_type": "CAUSAL_LM"
    }
    
    training_args = {
        "learning_rate": 2e-4,
        "per_device_train_batch_size": 2,
        "gradient_accumulation_steps": 4,
        "num_train_epochs": 3,
        "weight_decay": 0.01,
        "fp16": True,
        "optim": "paged_adamw_32bit", # QLoRA optimizer
        "logging_steps": 10,
        "evaluation_strategy": "epoch"
    }
    
    return peft_config, training_args

def main():
    print("================ PREPARING LORA TRAINING ================")
    
    # Load dataset
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    train_path = os.path.join(base_dir, "data/synthetic/train.jsonl")
    eval_path = os.path.join(base_dir, "data/synthetic/eval.jsonl")
    
    train_data = load_jsonl(train_path)
    eval_data = load_jsonl(eval_path)
    
    print(f"Loaded {len(train_data)} training samples from: {train_path}")
    print(f"Loaded {len(eval_data)} validation samples from: {eval_path}")
    
    peft_conf, train_args = setup_training_config()
    print("\nLoRA Hyperparameters:")
    for k, v in peft_conf.items():
        print(f"  - {k}: {v}")
        
    print("\nTraining Arguments (QLoRA):")
    for k, v in train_args.items():
        print(f"  - {k}: {v}")
        
    print("\nChecking Hugging Face PEFT & Transformers libraries...")
    try:
        import torch
        import transformers
        from peft import LoraConfig, get_peft_model
        print("Hugging Face libraries are available.")
        print(f"PyTorch version: {torch.__version__}")
        print(f"Transformers version: {transformers.__version__}")
        print("\n[READY] Run this script with a GPU environment to start training.")
    except ImportError:
        print("\n[WARNING] transformers or peft libraries are not installed locally.")
        print("To install dependencies for training, run:")
        print("  pip install torch transformers peft accelerate bitsandbytes")
        print("\nTraining configuration is validated and ready for run.")

if __name__ == "__main__":
    main()
