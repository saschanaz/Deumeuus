# Deumeuus
Experimental Mastodon client for Windows based on HTML5

## Deployment

Update timestamp of the Node.js dependencies for Visual Studio to correctly include the updated files.

```powershell
(ls -r node_modules) | foreach-object { $_.lastwritetime = get-date }
```
