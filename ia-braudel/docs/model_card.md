# Fiche Modèle — Braudel IA (GGUF)

Ce document décrit le modèle localisé **Braudel IA**, sa méthode d'entraînement, le protocole d'exportation vers le format GGUF et les limites d'utilisation.

---

## 1. Description du Modèle

* **Modèle de base :** Qwen 2.5 Coder 7B Instruct (ou similaire, open-weight).
* **Méthode :** Fine-tuning léger par adaptateur LoRA (Rank 16, Alpha 32) avec quantization QLoRA 4-bit (paged_adamw_32bit).
* **Domaine ciblé :** Cartographie analytique, théorie de l'acteur-réseau (ANT) et ontologie historique Braudel.
* **Format cible final :** GGUF pour exécution locale via Ollama ou LM Studio.

---

## 2. Procédure d'Exportation & Quantization

Pour convertir l'adaptateur LoRA entraîné et le fusionner avec le modèle de base, puis le quantizer en format GGUF :

### Étape 1 : Fusionner les poids
Utilisez le script de fusion PEFT standard :
```bash
python merge_lora.py --base_model Qwen/Qwen2.5-Coder-7B-Instruct --lora_model ./lora_output --output_dir ./braudel-ia-merged
```

### Étape 2 : Conversion en format GGUF (via llama.cpp)
Clonez `llama.cpp` et installez les dépendances :
```bash
git clone https://github.com/ggerganov/llama.cpp
pip install -r llama.cpp/requirements.txt
```

Convertissez le dossier de poids fusionnés en GGUF (F16) :
```bash
python llama.cpp/convert_hf_to_gguf.py ./braudel-ia-merged --outfile ./braudel-ia-f16.gguf
```

### Étape 3 : Quantization 4-bit (Q4_K_M)
Quantizez le modèle f16 au format optimisé cible :
```bash
./llama.cpp/llama-quantize ./braudel-ia-f16.gguf ./braudel-ia-q4_k_m.gguf Q4_K_M
```

---

## 3. Conventions de Versioning

Les fichiers de modèles compilés suivent la structure de nommage :
`braudel-ia-[taille_parametres]-v[version_majeure].[quantization].gguf`

Exemple :
* **`braudel-ia-7b-v1.Q4_K_M.gguf`** (Modèle 7B, version 1, quantization recommandée Q4_K_M).
* **`braudel-ia-7b-v1.Q8_0.gguf`** (Modèle 7B, version 1, quantization haute fidélité Q8_0).

---

## 4. Limites et Garde-fous

* **Pas de chatbot généraliste :** Le modèle doit être utilisé uniquement pour la structuration de requêtes cartographiques.
* **Validation Runtime :** Toutes les sorties doivent obligatoirement passer par le pipeline de parsing défensif et les validateurs métier d'**IA Braudel** pour prévenir les hallucinations de formats.
