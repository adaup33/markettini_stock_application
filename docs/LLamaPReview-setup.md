```markdown
# LlamaPReview setup notes

1. Add repository secrets (Settings → Secrets → Actions):
   - MODEL_PROVIDER: "perplexity" or "huggingface" or "openai"
   - PERPLEXITY_API_KEY: (rotate the API key you posted publicly)
   - HF_TOKEN: (Hugging Face token, optional)
   - HF_MODEL: optional, e.g. "tiiuae/falcon-7b-instruct"
   - OPENAI_API_KEY: (optional)
   - OPENAI_MODEL: optional, e.g. "gpt-4o-mini"

2. Quick start:
   - Recommended: rotate your Perplexity key now, add new key as PERPLEXITY_API_KEY, set MODEL_PROVIDER=perplexity.
   - If Perplexity integration is not available to you, use MODEL_PROVIDER=huggingface with HF_TOKEN and HF_MODEL or MODEL_PROVIDER=openai with OPENAI_API_KEY.

3. Notes:
   - GitHub-hosted runners are CPU-only and not suitable for running large local models. For local models use a self-hosted runner with a GPU and adapt the script.
   - The script limits files included in prompts to reduce token usage and cost.
   - Perplexity API integration is left as a placeholder: if you have a documented endpoint add the implementation in scripts/llamapreview.py call_perplexity().

4. Testing:
   - Create a small test PR and verify a comment is posted on the PR.
   - If the workflow fails, check Actions → run logs for error messages.
