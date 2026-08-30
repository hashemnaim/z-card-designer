# Z Card Designer

You are a Senior Product Architect, UX Engineer, Frontend Engineer, and Template System Designer.

Build a production-oriented internal tool called:

Z Card Template Builder

This project is NOT a normal website.

It is a Template Authoring Tool for the Z Card platform.

The purpose of this application is to allow me to visually create UI Templates for Z Card based on predefined Card Types and Data Contracts, preview them using Demo Data, and finally export/download a standalone Template Package that can later be uploaded to the Z Card Admin Dashboard.

1. CORE PRODUCT GOAL

The application should allow this workflow:

Choose Card Type
        ↓
Load Official Data Contract
        ↓
Choose / define visual style
        ↓
Provide visual reference if available
        ↓
Choose important fields / sections
        ↓
Generate Template UI
        ↓
Preview with Demo Data
        ↓
Validate Template
        ↓
Export Template Package
        ↓
Download ZIP
        ↓
Upload ZIP to Z Card Admin

The application itself is only the Template Builder.

Do NOT build the Z Card backend or final Admin Dashboard inside this project.

2. CARD TYPES

The system currently supports three official Card Types:

personal
real-estate
cars

Each type must have its own official Data Contract.

The builder should be designed so additional Card Types can be added later.

3. OFFICIAL DATA CONTRACTS

The project must support loading official JSON Data Contract files.

The current contracts are conceptually:

personal.template.json
real-estate.template.json
cars.template.json

These files define:

available fields

API field keys

field types

required fields

optional fields

options

sections

global fields

The Data Contract is the source of truth.

The Template Builder must never rename API keys.

For example, if the API key is:

full_name

the generated Template must use:

full_name

Do NOT convert it to:

profile.name
name
user_name

unless an explicit mapping system is intentionally added later.

The current system should use the official API keys directly.

4. IMPORTANT ARCHITECTURE PRINCIPLE

Separate these concepts completely:

Data Contract
= what data CAN exist

Template Manifest
= what this specific design USES

Template Renderer
= how the selected data LOOKS

Demo Data
= local preview/test data

API Data
= production data

Do not mix them.

5. MULTIPLE DESIGNS PER CARD TYPE

The same Card Type can have unlimited Template Designs.

Example:

personal-luxury-v1
personal-minimal-v1
personal-dark-v1

real-estate-luxury-v1
real-estate-gallery-v1
real-estate-editorial-v1

cars-premium-v1
cars-dark-v1
cars-minimal-v1

All designs under the same Card Type use the same official Data Contract.

Do NOT create a new API JSON structure for each visual design.

6. TEMPLATE CREATION WIZARD

Do not immediately generate a Template.

The Template Builder UI should use a guided Wizard.

Step 1 — Card Type

Ask/select:

Personal
Real Estate
Cars

When selected:

Load the correct Data Contract.

Show the available fields.

Show required vs optional fields.

Step 2 — Style

Allow the user to choose or describe a visual style.

Suggested presets:

Luxury
Minimal
Modern
Premium
Corporate
Elegant
Dark
Light
Editorial
Bold
Futuristic
Clean

Also provide:

Custom Style Description

where the user can type a natural language design request.

Step 3 — Visual Reference

Ask:

Do you have a visual reference?

Allow:

image upload

screenshot upload

reference URL

optional text notes

The reference is only for UI inspiration.

Never change the Data Contract based on the reference.

Step 4 — Field Priority

Display all fields from the selected Data Contract.

Allow the user to mark fields as:

Required for this design
Recommended
Optional
Not used

This controls the Template Manifest.

The official Data Contract itself must remain unchanged.

Step 5 — Language & Direction

Support:

Arabic / RTL
English / LTR
Arabic + English
Auto

Step 6 — Template Identity

Generate or allow editing of:

Template Name
Template ID
Slug
Version

Example:

Name:
Luxury Personal

ID:
personal-luxury-v1

Slug:
personal-luxury

Version:
1.0.0

Template IDs must be unique.

7. TEMPLATE DESIGN WORKSPACE

After the Wizard, open a visual Template Workspace.

The workspace should show:

Left Sidebar

Data Contract fields.

Group fields by section.

Example:

Profile
Contact
Social
Gallery
Services
Seller
Vehicle
Property
Specifications
Features

depending on Card Type.

The user should be able to see:

field key
label
type
required/optional

Center

Live mobile-first Template Preview.

Use a realistic mobile canvas.

Example width:

390px – 430px

The design should look like the final Z Card.

Right Sidebar

Template properties such as:

Style
Colors
Typography
Spacing
Radius
Layout options
Section visibility
Field usage
RTL / LTR
Template metadata

Do not attempt to build a full Figma clone.

Keep the editor focused and practical.

8. AI TEMPLATE GENERATION

The application should support generating the Template UI from a natural language design request.

Example:

Create a luxury personal digital identity card inspired by Apple Contacts,
using white background, subtle gold accents, large photography,
floating contact buttons and premium typography.

The AI generation flow must use:

Selected Card Type
+
Official Data Contract
+
Selected Fields
+
Style Description
+
Reference

as constraints.

The AI must NOT invent API keys.

9. DEMO DATA GENERATOR

Each generated Template must include a separate Demo JSON file.

Its filename must match the Template ID.

Example:

Template ID:
personal-luxury-v1

Demo:
personal-luxury-v1.demo.json

Another example:

cars-premium-dark-v1.demo.json

The Demo JSON must use the exact API keys from the selected official Data Contract.

Never generate a separate Demo schema.

Demo Data is only for:

Preview
Testing
QA
Template Gallery
Screenshots

Production data will come from Z Card API.

10. LIVE DATA PREVIEW

The Template preview should support switching between:

Demo Data
Custom JSON
API-like Payload

Allow users to paste JSON into a testing panel.

The system should validate that the keys are compatible with the selected Card Type.

The raw JSON should never be displayed inside the actual Template UI.

11. MISSING DATA BEHAVIOR

Generated Templates must follow these rules:

Missing field → hide it

Empty string → hide it

null → hide it

Empty array → hide it

Empty section → hide entire section

Unknown field → ignore

Do NOT render fake values like:

Bedrooms: 0
Price: 0
N/A
Undefined

unless the actual API value explicitly contains them.

12. TEMPLATE RUNTIME CONTRACT

Generated standalone Templates should consume runtime data through:

window.ZCARD_DATA

and expose:

window.ZCardTemplate.render(data);

Example:

<script>
window.ZCARD_DATA = CARD_DATA_FROM_API;
</script>

<script src="template.js"></script>

The Template Renderer must not care whether the data came from:

Demo JSON
or
Z Card API

Both must use the same Data Shape.

13. GENERATED TEMPLATE FILES

Every exported Template must contain:

<template-id>/
├── index.html
├── styles.css
├── template.js
├── manifest.json
├── <template-id>.demo.json
└── assets/

Example:

personal-luxury-v1/
├── index.html
├── styles.css
├── template.js
├── manifest.json
├── personal-luxury-v1.demo.json
└── assets/

14. INDEX.HTML

The exported index.html should be minimal.

Example responsibility:

load styles.css
create #zcard-root
load template.js
receive ZCARD_DATA

Do not include application/editor code.

The exported Template should be independent from the Template Builder.

15. STYLES.CSS

Contains only Template styling.

The exported CSS must not depend on the Template Builder UI.

Keep Template CSS isolated.

Use a naming prefix such as:

zc-

where practical to avoid style collisions.

16. TEMPLATE.JS

This is the standalone renderer.

Responsibilities:

receive ZCARD_DATA

validate required display values

build DOM

render arrays

hide missing fields

hide empty sections

handle actions

render images

render social links

render galleries

support RTL/LTR

safely handle URLs

support re-rendering

Do not require React in the exported runtime.

Do not require TanStack.

Do not require Lovable.

Do not require the Template Builder.

Use Vanilla JS for the exported runtime.

17. MANIFEST.JSON

Each exported Template must contain manifest.json.

Example:

{
  "id": "personal-luxury-v1",
  "slug": "personal-luxury",
  "name": "Personal Luxury",
  "version": "1.0.0",

  "card_type": "personal",
  "schema_version": "personal-v1",

  "entry": "index.html",
  "style": "styles.css",
  "script": "template.js",

  "demo_data": "personal-luxury-v1.demo.json",

  "supports": {
    "rtl": true,
    "ltr": true,
    "languages": ["ar", "en"]
  },

  "field_usage": {
    "required": [],
    "recommended": [],
    "optional": []
  }
}

The manifest.json describes this specific visual Template.

It does NOT redefine the complete Data Contract.

18. DATA CONTRACT STORAGE

The three official Data Contracts should be stored centrally inside the Template Builder project.

Recommended:

src/contracts/
├── personal.template.json
├── real-estate.template.json
└── cars.template.json

Generated Template ZIPs should NOT need to contain duplicate full Data Contracts unless explicitly required by the Z Card Admin importer.

The exported manifest should reference:

card_type
schema_version

19. TEMPLATE VALIDATION

Before allowing Export, validate:

Manifest

Required:

id
name
version
card_type
schema_version
entry
style
script
demo_data

Files

Confirm:

index.html exists
styles.css exists
template.js exists
demo JSON exists
manifest.json exists

Demo

Verify:

JSON valid

keys belong to selected Data Contract

required data exists

no invented API keys

Runtime

Verify:

window.ZCardTemplate.render(data)

works.

Security

User content must not be injected directly through unsafe HTML.

Prefer:

textContent
createElement
setAttribute

for dynamic content.

20. TEMPLATE EXPORT

Add a clear button:

Export Template

When clicked:

validate the Template

generate final files

generate Demo JSON

generate Manifest

collect local assets

package everything

generate ZIP

download ZIP

Example:

personal-luxury-v1.zip

This ZIP is what I will upload to the Z Card Admin Dashboard.

21. EXPORT PREVIEW

Before downloading, display:

Template ID
Card Type
Schema Version
Version
Used Fields
Required Fields
Demo File
Export Files
Validation Status

Show errors before Export.

22. TEMPLATE LIBRARY

The Builder should maintain a local/internal Template Library.

Display cards containing:

Preview
Template Name
Card Type
Version
Style
Last Updated

Actions:

Open
Duplicate
Edit
Preview
Export
Delete

Duplicate should create a new Template ID.

23. CREATE NEW TEMPLATE

Add a prominent button:

+ New Template

This always opens the Template Creation Wizard.

Do not start from an empty unstructured canvas.

24. TEMPLATE PROJECT STRUCTURE

Recommended internal structure:

src/
├── contracts/
│   ├── personal.template.json
│   ├── real-estate.template.json
│   └── cars.template.json
│
├── builder/
│   ├── wizard/
│   ├── editor/
│   ├── preview/
│   └── export/
│
├── templates/
├── components/
└── lib/

Generated Templates should be separated from Builder source code.

25. INITIAL UI

Build the application with a professional product UI.

Style:

clean
developer-focused
premium
minimal
modern

Visual inspiration:

Linear
Vercel
Raycast
Stripe Dashboard
Figma Dev Mode

Do not make it look like a consumer landing page.

This is an internal design/build tool.

26. HOME SCREEN

The home/dashboard should contain:

Z Card Template Builder

with:

New Template button

Card Type filters

Template Library

recent Templates

validation status

export status

27. DO NOT BUILD

Do NOT build:

Z Card authentication system

billing

subscriptions

public marketplace

full Z Card backend

production API

user card management

analytics platform

unrelated admin features

Focus only on:

Template Creation
Template Preview
Template Validation
Template Export

28. FIRST VERSION PRIORITY

For V1, prioritize:

1. Card Type Contracts
2. Creation Wizard
3. Template generation
4. Demo Data generation
5. Live Preview
6. Manifest generation
7. Validation
8. ZIP export
9. Template Library

Do not over-engineer a drag-and-drop page builder in V1.

AI-assisted generation + structured configuration is enough.

29. IMPORTANT FINAL PRINCIPLE

The entire application should enforce:

One Card Type
       ↓
One Stable Official Data Contract
       ↓
Unlimited Visual Templates
       ↓
Each Template chooses its fields
       ↓
Same API Keys
       ↓
Demo Data matches Production Data Shape
       ↓
Standalone Export
       ↓
Upload ZIP to Z Card Admin

The UI design is flexible.

The API contract is not.

30. AFTER BUILDING V1

When the implementation is complete, report:

project structure

how Data Contracts are loaded

how the Wizard works

how Templates are stored

how Demo JSON is generated

how Manifest is generated

how Preview works

how validation works

how ZIP Export works

where exported files are produced

remaining limitations

recommended next step for integrating the exported ZIP into Z Card Admin

Do not stop at a mockup.

Build the functional Template Builder workflow.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5c8b503c-8715-45fa-9060-488460dfcffe).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
