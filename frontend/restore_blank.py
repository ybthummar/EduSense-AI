import os, glob
for f in glob.glob('src/**/*.jsx', recursive=True):
    if os.path.getsize(f) == 0:
        os.system(f'git restore "{f}"')
        print(f"Restored {f}")
