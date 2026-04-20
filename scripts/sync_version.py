import os
import re
import json
import sys

def update_file(file_path, pattern, replacement):
    """Updates a file using regex pattern substitution."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = re.sub(pattern, replacement, content)
        
        if content != new_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {file_path}")
        else:
            print(f"No changes needed: {file_path}")
    except FileNotFoundError:
        print(f"Warning: File not found: {file_path}")
    except Exception as e:
        print(f"Error updating {file_path}: {e}")

def update_json(file_path, key, new_value):
    """Updates a specific key in a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if data.get(key) != new_value:
            data[key] = new_value
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4) # Using default indent 4 for most JSONs or adjust if needed
            print(f"Updated JSON: {file_path}")
        else:
            print(f"No changes needed JSON: {file_path}")
    except FileNotFoundError:
        print(f"Warning: File not found: {file_path}")
    except Exception as e:
        print(f"Error updating {file_path}: {e}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python sync_version.py <new_version>")
        sys.exit(1)

    new_version = sys.argv[1]
    print(f"Syncing version to: {new_version}")

    # 1. Root package.json
    # Note: Using 4 spaces indent to match typical file format, or try to respect existing if complex
    # Simplified JSON update logic might reformat the file. 
    # To be safer with formatting, we can use regex for JSON too if we want to preserve exact whitespace,
    # but json module is safer for structure. 
    # Let's stick to regex for minimum invasiveness on formatting unless structure is robust.
    # Actually, package.json usually standardizes on 2 or 4 spaces.
    
    # Strategy: Regex for minimal diff noise on other lines
    
    # package.json "version": "..."
    update_file('package.json', r'"version":\s*"[^"]+"', f'"version": "{new_version}"')

    # web/package.json
    update_file('web/package.json', r'"version":\s*"[^"]+"', f'"version": "{new_version}"')

    # pyproject.toml version = "..."
    # Use \b to ensure we don't match python_version or other keys ending in version
    update_file('pyproject.toml', r'\bversion\s*=\s*"\d+\.\d+\.\d+"', f'version = "{new_version}"')
    # Also support existing values that might not match \d.\d.\d exactly if we want to be robust, 
    # but for safety let's use the generic string content again but with \b
    update_file('pyproject.toml', r'\bversion\s*=\s*"[^"]+"', f'version = "{new_version}"')

    # skills_cli/__init__.py __version__ = "..."
    update_file('skills_cli/__init__.py', r'__version__\s*=\s*"[^"]+"', f'__version__ = "{new_version}"')

    # src/extension.ts 
    # Searching for: roleStandard: 'ChronicleCore V1.2.5'
    update_file('src/extension.ts', r"roleStandard:\s*'ChronicleCore V[^']+'", f"roleStandard: 'ChronicleCore V{new_version}'")
    
    # web/src/App.tsx
    # 1. intro: 'V1.2.5 Standard...
    update_file('web/src/App.tsx', r"intro:\s*'V[^ ]+ Standard", f"intro: 'V{new_version} Standard")
    # 2. s2: '... V1.2.5 stability.'
    # Flexible regex to catch the second occurrence
    update_file('web/src/App.tsx', r"V\d+\.\d+\.\d+ stability", f"V{new_version} stability")
    # 3. intro: 'V1.2.5 規格... (jp/kr etc if needed, but App.tsx has localized strings)
    # Let's look at App.tsx again. It has multiple langs.
    # We should likely target all "V{number}" patterns if appropriate, or specific keys.
    # The file has:
    # en: intro: V1.2.5 Standard
    # tw: intro: V1.2.5 標準
    # jp: intro: V1.2.5 規格
    # kr: intro: V1.2.5 표준
    # And s2 in each lang.
    
    # Global replacement for V\d.\d.\d might be too aggressive if there are other versions (like dependencies).
    # But inside App.tsx it seems focused on the app version.
    
    print("Updating App.tsx localized strings...")
    # We will use a more targeted regex for App.tsx to avoid false positives (though unlikely in this file)
    # Targets: "V1.2.5" preceded by ' or space, looking for version-like patterns in string values
    
    # Pattern: Look for VX.Y.Z that is likely our version
    # We can just replace all V\d+\.\d+\.\d+ inside App.tsx because it's the UI display version.
    update_file('web/src/App.tsx', r"V\d+\.\d+\.\d+", f"V{new_version}")

if __name__ == "__main__":
    main()
