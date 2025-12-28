import base64
import os

# 16x16 Blue Square PNG
icon_base64 = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMjHxIGpIAAAAM0lEQVQ4T2NkoBAwUqifgWoG/v///x+HGAMDAwMDwygYqGYADR8D/w//H4cYA4PBDKBiBgB7EBAJ/0G/iAAAAABJRU5ErkJggg=="

assets_dir = os.path.join("web-analysis-extension", "assets")
if not os.path.exists(assets_dir):
    os.makedirs(assets_dir)

files = ["icon16.png", "icon48.png", "icon128.png"]

for filename in files:
    with open(os.path.join(assets_dir, filename), "wb") as f:
        f.write(base64.b64decode(icon_base64))

print("Icons created successfully.")
