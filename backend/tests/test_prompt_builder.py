import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.prompts import PromptBuilder
from schemas.models import RepositorySummary


class PromptBuilderRecommendationTest(unittest.TestCase):
    def test_recommend_prompt_includes_only_curated_library_list(self):
        summary = RepositorySummary(
            repository="demo",
            repository_type="web",
            languages=["JavaScript"],
            frameworks=["React"],
            databases=[],
            package_managers=["npm"],
        )

        builder = PromptBuilder(summary)
        prompt = builder.recommend("What are good libraries for a landing page?")

        self.assertIn("Only choose from this curated list of 8 libraries:", prompt)
        for name in [
            "React",
            "Next.js",
            "Tailwind CSS",
            "Framer Motion",
            "GSAP",
            "Chakra UI",
            "Material UI",
            "shadcn/ui",
        ]:
            self.assertIn(name, prompt)


if __name__ == "__main__":
    unittest.main()
