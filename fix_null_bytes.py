import os, glob
for f in glob.glob(r'C:\Users\Bhavya Manvar\EduSense-AI\frontend\src\**\*.js*', recursive=True):
    try:
        content = open(f, 'rb').read()
        if b'\x00' in content:
            new_content = content.replace(b'\x00', b'')
            open(f, 'wb').write(new_content)
            print(f"Fixed null bytes in {f}")
    except Exception as e:
        pass
