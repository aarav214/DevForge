import json
from typing import Type, TypeVar, Any
from pydantic import BaseModel
from backend.core.guardrails import OutputGuardrails
from backend.core.logger import logger
import re

T = TypeVar("T", bound=BaseModel)

class SchemaCleaner:
    @classmethod
    def parse_and_validate(cls, raw_response: str, expected_schema: Type[T]) -> T:
        """
        Cleans the LLM output and validates it against the expected Pydantic schema.
        """
        cleaned_text = OutputGuardrails.clean_text(raw_response)
        
        try:
            # First attempt: direct JSON load
            data = json.loads(cleaned_text)
            return expected_schema(**data)
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"First JSON extraction failed: {str(e)}")
            
            # Second attempt: Look for markdown JSON block specifically
            match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw_response, re.DOTALL)
            if match:
                try:
                    data = json.loads(match.group(1))
                    return expected_schema(**data)
                except Exception:
                    pass
            
            # Third attempt: try to extract JSON from text finding the first { and last }
            start = raw_response.find('{')
            end = raw_response.rfind('}')
            
            if start != -1 and end != -1 and end > start:
                try:
                    json_str = raw_response[start:end+1]
                    data = json.loads(json_str)
                    return expected_schema(**data)
                except (json.JSONDecodeError, ValueError) as e2:
                    logger.error(f"Fallback JSON extraction failed: {str(e2)}")
                    raise ValueError(f"Failed to parse LLM response as valid JSON matching schema: {str(e2)}")
            
            raise ValueError(f"LLM response did not contain valid JSON.")
