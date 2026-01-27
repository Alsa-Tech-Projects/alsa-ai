import subprocess

url = "http://localhost:8080/"
chrome_path = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" # Chrome ka sahi path check kar lein
# Agar aapko Chrome ka path nahi pata, toh 'chrome' bhi try kar sakte hain, aksar woh PATH mein hota hai.


command = f'"{chrome_path}" --app={url} --new-window'

try:
    subprocess.run(command, shell=True, check=True)
    print(f"Opened {url} in Chrome application mode.")
except subprocess.CalledProcessError as e:
    print(f"Error opening Chrome: {e}")
    print("Please make sure Chrome is installed and the path is correct.")
except FileNotFoundError:
    print(f"Chrome not found at '{chrome_path}'. Please verify the path.")