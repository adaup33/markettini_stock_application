#!/usr/bin/env python3
"""
LlamaPReview runner:
- Collects PR changed files using the GitHub API (GITHUB_TOKEN)
- Builds a concise prompt tailored for stock-market apps
- Sends prompt to provider: Perplexity (placeholder), Hugging Face, or OpenAI
- Posts a PR comment with the model response
Environment:
- GITHUB_TOKEN (required)
- MODEL_PROVIDER ("perplexity" | "huggingface" | "openai" | "local")
- If perplexity: PERPLEXITY_API_KEY
- If huggingface: HF_TOKEN, HF_MODEL
- If openai: OPENAI_API_KEY, OPENAI_MODEL
- LOCAL_MODEL_PATH (only for self-hosted runners)
"""
import os
import sys
import json
import requests
from typing import List

GITHUB_API = "https://api.github.com"

def load_event(event_path_arg):
    event_path = os.environ.get("GITHUB_EVENT_PATH") or (event_path_arg if event_path_arg else None)
    if not event_path or not os.path.exists(event_path):
        raise SystemExit("GITHUB_EVENT_PATH not found. Provide path or run from GitHub Actions.")
    with open(event_path, "r") as f:
        return json.load(f)

def gh_request(path, token, method="GET", json_payload=None, raw=False):
    url = f"{GITHUB_API}{path}"
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
    r = requests.request(method, url, headers=headers, json=json_payload, timeout=60)
    r.raise_for_status()
    return r.content if raw else r.json()

def list_pr_files(owner, repo, pr_number, token) -> List[dict]:
    path = f"/repos/{owner}/{repo}/pulls/{pr_number}/files"
    files = []
    page = 1
    while True:
        res = gh_request(f"{path}?per_page=100&page={page}", token)
        if not res:
            break
        files.extend(res)
        if len(res) < 100:
            break
        page += 1
    return files

def summarize_changed_files(files, limit=8, chars_per_patch=1500):
    file_summaries = []
    for f in files[:limit]:
        filename = f.get("filename")
        patch = f.get("patch") or ""
        truncated_patch = (patch[:chars_per_patch] + "\n...[truncated]") if len(patch) > chars_per_patch else patch
        file_summaries.append(f"FILE: {filename}\n---\n{truncated_patch}\n")
    return file_summaries

def generate_prompt(repo_full, pr_number, file_summaries):
    header = f"You are LlamaPReview — give a focused code review for a stock-market app.\nRepository: {repo_full}\nPR: {pr_number}\n\n"
    instructions = (
        "Produce:\n"
        "1) A concise summary of the changes (3-5 sentences).\n"
        "2) Security, correctness, and data-quality risks specific to finance/market data.\n"
        "3) Suggested tests and monitoring to add.\n"
        "4) Small code suggestions or examples for any clear issues.\n\n"
        "Be concise and use bullet-style output, labeled sections.\n\n"
    )
    files_text = "\n---\n".join(file_summaries) if file_summaries else "(no file patches available)"
    return header + instructions + "\nFiles (truncated):\n" + files_text

def call_perplexity(prompt, token):
    # Perplexity's public API is not standardly available; this is a placeholder.
    # If you have a Perplexity Teams/partner API endpoint, implement the request here.
    # For now, we'll raise an error so the workflow fails clearly if MODEL_PROVIDER=perplexity
    raise NotImplementedError("Perplexity API integration is not implemented in this script. Add a provider implementation or use Hugging Face / OpenAI.")

def call_huggingface(model, prompt, hf_token):
    url = f"https://api-inference.huggingface.co/models/{model}"
    headers = {"Authorization": f"Bearer {hf_token}"}
    payload = {"inputs": prompt, "parameters": {"max_new_tokens": 512, "temperature": 0.2}}
    r = requests.post(url, headers=headers, json=payload, timeout=60)
    r.raise_for_status()
    out = r.json()
    if isinstance(out, list):
        first = out[0]
        return first.get("generated_text") or str(first)
    if isinstance(out, dict) and out.get("error"):
        raise Exception(out.get("error"))
    return str(out)

def call_openai(model, prompt, api_key):
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a concise code reviewer with finance expertise."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 512
    }
    r = requests.post(url, headers=headers, json=data, timeout=60)
    r.raise_for_status()
    res = r.json()
    return res["choices"][0]["message"]["content"]

def post_pr_comment(owner, repo, issue_number, body, token):
    path = f"/repos/{owner}/{repo}/issues/{issue_number}/comments"
    return gh_request(path, token, method="POST", json_payload={"body": body})

def main():
    event = load_event(sys.argv[1] if len(sys.argv) > 1 else None)
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise SystemExit("GITHUB_TOKEN is required in environment")
    repo_full = event.get("repository", {}).get("full_name")
    if not repo_full:
        raise SystemExit("Cannot determine repo from event payload")
    owner, repo = repo_full.split("/")
    pr = event.get("pull_request")
    if not pr:
        raise SystemExit("This script expects a pull_request event")
    pr_number = pr["number"]

    files = list_pr_files(owner, repo, pr_number, token)
    file_summaries = summarize_changed_files(files, limit=8, chars_per_patch=1500)
    prompt = generate_prompt(repo_full, pr_number, file_summaries)

    provider = (os.environ.get("MODEL_PROVIDER") or "perplexity").lower()
    print(f"Using provider: {provider}")

    if provider == "perplexity":
        key = os.environ.get("PERPLEXITY_API_KEY")
        if not key:
            raise SystemExit("PERPLEXITY_API_KEY required for perplexity provider")
        result = call_perplexity(prompt, key)
    elif provider == "huggingface":
        hf_token = os.environ.get("HF_TOKEN")
        hf_model = os.environ.get("HF_MODEL") or "tiiuae/falcon-7b-instruct"
        if not hf_token:
            raise SystemExit("HF_TOKEN required for huggingface provider")
        result = call_huggingface(hf_model, prompt, hf_token)
    elif provider == "openai":
        api_key = os.environ.get("OPENAI_API_KEY")
        model = os.environ.get("OPENAI_MODEL") or "gpt-4o-mini"
        if not api_key:
            raise SystemExit("OPENAI_API_KEY required for openai provider")
        result = call_openai(model, prompt, api_key)
    else:
        raise SystemExit(f"Unknown provider: {provider}")

    body = (
        f"## LlamaPReview — automated review\n\n"
        f"**Model provider:** {provider}\n\n"
        f"{result}\n\n"
        f"---\n*This comment was created by an automated review workflow.*"
    )
    post_pr_comment(owner, repo, pr_number, body, token)
    print("Posted review comment.")

if __name__ == "__main__":
    main()
