# DevForge AI — Project Context for AI Agent

## Overview

DevForge AI is an **AI-powered software architecture and developer assistant** built for the **Google Build with Gemma Hackathon**.

Its primary objective is **not** to replace GitHub Copilot or ChatGPT, but to help developers understand an existing codebase and recommend the best engineering decisions based on the current project structure.

The assistant is designed to analyze repositories, understand their technology stack, and provide concise, production-focused recommendations.

---

# Core Philosophy

DevForge is **Repository-Aware AI**, not a general chatbot.

Every answer should be based on the repository currently being analyzed.

Instead of asking:

> "What's the best authentication library?"

DevForge understands:

* Current framework
* Existing dependencies
* Project architecture
* Programming language
* Database
* Package manager
* AI stack
* Testing framework
* Deployment stack

Then recommends the most compatible solution.

---

# Main Workflow

```
VS Code Extension
        │
        ▼
Repository Parser
        │
        ▼
Repository Summary
        │
        ▼
Guardrails
        │
        ▼
Prompt Builder
        │
        ▼
Gemma 4
        │
        ▼
Response Cleaner
        │
        ▼
Structured JSON
        │
        ▼
VS Code Webview
```

---

# Tech Stack

## AI

* Gemma 4 E4B IT
* Transformers
* PyTorch
* Kaggle GPU (T4)

Future:

* QLoRA
* PEFT
* RAG
* FAISS
* Sentence Transformers

---

## Backend

Python

FastAPI

Pydantic

Repository Parser

Guardrails

Prompt Builder

Gemma Client

Response Cleaner

REST API

---

## Frontend

VS Code Extension

TypeScript

React

Webview API

Interactive Dependency Graph

Syntax Highlighting

---

# Current Backend Structure

```
backend/

parser.py
prompts.py
guardrails.py
response_cleaner.py
gemma_client.py
agent.py
main.py
models.py
utils.py
```

---

# Repository Parser

The parser recursively scans repositories.

Supported manifests:

* package.json
* requirements.txt
* pyproject.toml
* Cargo.toml
* go.mod
* pom.xml
* pubspec.yaml

Extracts:

* Languages
* Frameworks
* Dependencies
* Versions
* Package Manager
* ORM
* Database
* Repository Type
* Monorepo Detection

Returns structured JSON.

The parser is considered complete and should not be modified unless absolutely necessary.

---

# Prompt Builder

The prompt builder converts repository information into prompts for Gemma.

It has multiple prompt templates.

Examples:

* Library Recommendation
* Bug Detection
* Code Explanation
* Architecture Review
* Dependency Review
* Security Review
* Project Summary

Prompts should produce deterministic, concise outputs.

---

# Guardrails

Guardrails execute **before** Gemma.

Their job is to determine whether the request belongs to software engineering.

Allowed examples:

* Python
* JavaScript
* React
* FastAPI
* Docker
* Git
* SQL
* Bug Fixes
* Library Recommendation
* Architecture
* API Design
* DevOps
* CI/CD

Blocked examples:

* Politics
* Religion
* Medical Advice
* Finance
* History
* Entertainment
* General Knowledge
* Personal Advice

If blocked:

Return

```json
{
    "error":"Only software engineering questions are supported."
}
```

Gemma should never be called for blocked requests.

---

# Response Cleaner

Gemma sometimes generates:

* Greetings
* Long introductions
* Repeated user questions
* Closing paragraphs
* Markdown formatting

These should be removed.

The cleaner should produce minimal structured responses.

---

# AI Behavior

DevForge is **not** a conversational chatbot.

It is a software engineering assistant.

It should:

* Stay on topic
* Be concise
* Avoid unnecessary explanations
* Recommend production-ready solutions
* Mention trade-offs briefly
* Never hallucinate repository information
* Never invent dependencies
* Never recommend deprecated libraries

---

# Output Philosophy

Responses should be optimized for UI rendering.

Example:

Input:

```
Python 3.13

Goal

Math calculations
```

Preferred Output:

```json
{
    "recommendations":[
        {
            "library":"NumPy",
            "use_case":"Fast numerical operations."
        },
        {
            "library":"SymPy",
            "use_case":"Symbolic mathematics."
        }
    ]
}
```

Not:

* Long essays
* Tutorials
* Blog-style explanations

---

# Supported Features

Current:

* Explain Code
* Find Bugs
* Recommend Libraries
* Architecture Review
* Dependency Analysis
* Project Summary
* Security Review

Future:

* Repository Chat
* RAG
* Documentation Search
* Code Generation
* Multi-file Context
* GitHub Issue Analysis
* Automatic Refactoring
* Multi-Agent Workflow

---

# Design Principles

Every backend module should have a single responsibility.

Parser

↓

Repository JSON

↓

Guardrails

↓

Prompt Builder

↓

Gemma Client

↓

Response Cleaner

↓

API

Each module should remain independent.

---

# API Philosophy

The frontend should never communicate with Gemma directly.

Frontend

↓

FastAPI

↓

Gemma

This allows:

* Authentication
* Logging
* Analytics
* Guardrails
* Prompt Engineering
* Response Validation

---

# Performance Goals

Target response time:

2–5 seconds.

Responses should generally be under 150 generated tokens.

The backend should minimize token usage by sending summarized repository context rather than entire dependency trees.

---

# Development Guidelines

* Keep modules small and focused.
* Prefer deterministic outputs.
* Return JSON whenever possible.
* Avoid unnecessary abstraction during the hackathon.
* Prioritize shipping a polished end-to-end workflow over adding more features.
* Do not introduce breaking changes to completed modules without strong justification.

---

# Goal

The final product should feel like an AI Software Architect integrated into VS Code.

A developer scans a repository, asks a software engineering question, and receives a short, repository-aware, production-ready answer that can be rendered directly in the UI without additional processing.
