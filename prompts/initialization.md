# Personal knowledge database: patchouli

## Overview

This app is a self-learning tool. It condense the knowledge from every session into a interactive knowledge database. Typically, the user will provide some content, for example paper, blog, or just concepts. After interact with AI chatbot and fully understand the knowledge, the user will call patchouli to condense the knowledge covered in this session into the database, with user defined categories and annotations. The knowledge will be stored as a markdown file, called a card. If connections exists between cards, then an external link will be created using Obsidian. 

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
2. condense the dialogue into clear and concise content that summarize the user's understanding
3. how to judge whether two cards should have connections
4. quick inquiries in the database

#### UI

A brief UI. When the user decide to submit one understood knowledge to the database, this UI will ask for the following information: name, categories, annotations. These then turn into content inside one card.

## Path
The app source files should be in D:\Codex\workspaces\patchouli_knowledge_database.
The database can be built anywhere.
