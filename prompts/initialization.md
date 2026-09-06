# Personal knowledge database: patchouli

## Overview

This app is a self-learning tool. It condenses the knowledge from every session into an interactive knowledge database. Typically, the user will provide some content, for example a paper, blog, or concept. After interacting with an AI chatbot and understanding the knowledge, the user will call Patchouli to condense the knowledge covered in the session into the database, with user-defined categories and an editable agent-written Summary. A more concrete, paraphrased Detail section expands the Summary and supports Markdown/LaTeX formulas. The knowledge is stored as a Markdown file called a card. When connections exist between cards, Obsidian wikilinks are created.

## Scope

Designed for self-learner. This should be a very fundamental tool that can build knowledge database in any domain, depending on the material provided by the user.

## Infrastructure

Use Obsidian engine to manage knowledge cards and generate external links. The condensation and the submission into the knowledge database are controlled by agents. Inquiries are handled by agents.

## Inputs

- academic paper
- code
- blog from xiaohongshu
- website page
- user's questions
- youtube video (to be decided)

## Tools

#### Skills
For these skills, try to search the website whether there are built-in skills, or we should develop ourselves.

1. read the input and pickout the critical concepts
2. condense the dialogue into a concise Summary plus a substantially more concrete, paraphrased Detail section
3. how to judge whether two cards should have connections
4. quick inquiries in the database

#### UI

A brief UI. When the user decides to submit one understood concept to the database, the UI lets them edit the name, categories, agent-written Summary, detailed Markdown explanation, evidence, sources, and selected connections before saving one card.

## Path
The app source files should be in D:\Codex\workspaces\patchouli_knowledge_database.
The database can be built anywhere.
