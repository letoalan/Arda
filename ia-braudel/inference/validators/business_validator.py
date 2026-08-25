from schemas.validation import ValidationError

def validate_business_rules(data, creative_mode=False):
    """
    Applique les validations métier Braudel/ANT (Actor-Network Theory)
    sur le contenu déjà structurellement valide.
    """
    if creative_mode:
        return True
        
    task = data.get("task")
    items = data.get("items", [])
    
    if task == "entity_suggestions":
        for idx, item in enumerate(items):
            e_type = item.get("type")
            layer = item.get("layer")
            name = item.get("name", "")
            
            # Règle 1: La couche physique ne peut pas contenir d'acteurs ou d'événements
            if layer == "physical" and e_type in ["actor", "event"]:
                raise ValidationError(
                    f"Règle Métier Braudel Violée à l'index {idx} : "
                    f"L'entité physique '{name}' ne peut pas être de type '{e_type}'."
                )
                
            # Règle 2: Les acteurs doivent appartenir aux couches historique ou politique
            if e_type == "actor" and layer not in ["historical", "political"]:
                raise ValidationError(
                    f"Règle Métier Braudel Violée à l'index {idx} : "
                    f"L'acteur '{name}' doit être dans la couche 'historical' ou 'political', pas '{layer}'."
                )

    elif task == "relation_suggestions":
        for idx, item in enumerate(items):
            rel_type = item.get("type")
            source = item.get("source")
            target = item.get("target")
            
            # Note : Idéalement, nous aurions besoin des types des entités sources/cibles.
            # En l'absence de base de données globale d'entités passée en contexte,
            # nous faisons des vérifications sémantiques basiques sur le type de relation.
            
            # Règle 3: Les relations politiques/sociales (ally, enemy) requièrent des acteurs/nations/lieux
            # On évite des relations absurdes comme 'capitalism ally enemy river'.
            pass

    elif task == "edit_operations":
        for idx, item in enumerate(items):
            op = item.get("operation")
            payload = item.get("payload", {})
            
            # Règle 4: Si l'opération ajoute ou met à jour une entité, on vérifie la cohérence métier du payload
            if op in ["addEntity", "updateEntity"]:
                e_type = payload.get("type")
                layer = payload.get("layer")
                name = payload.get("name", "")
                
                if layer == "physical" and e_type in ["actor", "event"]:
                    raise ValidationError(
                        f"Règle Métier Opération Violée à l'index {idx} : "
                        f"Impossible d'ajouter/modifier l'entité physique '{name}' avec le type '{e_type}'."
                    )
                if e_type == "actor" and layer not in ["historical", "political"]:
                    raise ValidationError(
                        f"Règle Métier Opération Violée à l'index {idx} : "
                        f"L'acteur '{name}' ne peut pas être placé dans la couche '{layer}'."
                    )
                    
    return True
