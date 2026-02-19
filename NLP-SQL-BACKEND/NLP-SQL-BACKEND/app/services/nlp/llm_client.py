import requests
import re


class LLMClient:
    """
    LLM Client for generating SQL queries.
    Designed to be provider-agnostic, currently defaulted to Ollama.
    """

    def __init__(self, model: str = "llama3:8b", base_url: str = "http://localhost:11434", provider: str = "ollama"):
        self.model = model
        self.base_url = base_url
        self.provider = provider

    def generate(self, prompt: str) -> str:
        """
        Sends prompt to the LLM provider and returns cleaned SQL output.
        """
        if self.provider == "ollama":
            return self._generate_ollama(prompt)
        else:
            raise NotImplementedError(f"Provider {self.provider} not supported.")

    def _generate_ollama(self, prompt: str) -> str:
        """
        Internal method for Ollama HTTP API.
        """
        # Prepend system-like instruction to reinforcement constraints
        full_prompt = f"You generate SQL only.\n\n{prompt}"
        
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": full_prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0
                    }
                },
                timeout=150
            )

            if response.status_code != 200:
                raise RuntimeError(f"LLM request failed: {response.text}")

            result = response.json().get("response", "")
            return self._clean_output(result)
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Failed to connect to Ollama: {str(e)}")

    def _clean_output(self, text: str) -> str:
        """
        Harden cleaning: Extracts everything from the first SELECT onwards
        and strips markdown distractions.
        """
        text = text.strip()

        # Remove markdown code blocks
        text = re.sub(r"```sql", "", text, flags=re.IGNORECASE)
        text = re.sub(r"```", "", text)

        text = text.strip()

        # Harden extraction: Capture everything starting from 'SELECT'
        # This prevents partial capture bugs while letting SQLValidator handle the rest.
        match = re.search(r"(select[\s\S]+)", text, re.IGNORECASE)
        if match:
            sql = match.group(1).strip()
            return sql

        return text.strip()
