from abc import ABC, abstractmethod

class BaseLLM(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> str:
        """
        Takes a prompt string and returns the raw LLM string response.
        """
        pass
