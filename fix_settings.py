with open(r'c:\Users\lylep\Desktop\library system\backend\backend\settings.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    # Skip old MEDIA_ROOT check (lines 488-492)
    if i >= 487 and i <= 491:
        i += 1
        continue
    
    # Skip duplicate Cloudinary sections (lines 494-518)
    if i >= 493 and i <= 517:
        i += 1
        continue
    
    # Insert new Cloudinary config before STORAGES (line 520)
    if i == 519:
        new_lines.append('\n')
        new_lines.append('# Cloudinary Configuration\n')
        new_lines.append('CLOUDINARY_STORAGE = {\n')
        new_lines.append("    'CLOUD_NAME': get_env_str('CLOUDINARY_CLOUD_NAME'),\n")
        new_lines.append("    'API_KEY': get_env_str('CLOUDINARY_API_KEY'),\n")
        new_lines.append("    'API_SECRET': get_env_str('CLOUDINARY_API_SECRET'),\n")
        new_lines.append('}\n')
        new_lines.append('\n')
        new_lines.append("USE_CLOUDINARY = get_env_bool('USE_CLOUDINARY', False)\n")
        new_lines.append('\n')
        new_lines.append("if ENABLE_PRODUCTION_SECURITY and not USE_CLOUDINARY and not get_env_str('MEDIA_ROOT'):\n")
        new_lines.append('    raise ImproperlyConfigured(\n')
        new_lines.append("        'MEDIA_ROOT must be set when DEBUG is False. Use a persistent path such as a mounted volume.'\n")
        new_lines.append('    )\n')
        new_lines.append('if not USE_CLOUDINARY:\n')
        new_lines.append('    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)\n')
    
    new_lines.append(lines[i])
    i += 1

with open(r'c:\Users\lylep\Desktop\library system\backend\backend\settings.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Fixed settings.py")
