import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import * as http from 'http';
import { RegistryService } from './lib/registries/registry-service';


export function activate(context: vscode.ExtensionContext) {
  const provider = new DevForgeWebviewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'devforge.sidebar',
      provider
    )
  );

  // Trigger a scan on activation if a workspace folder is open
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    provider.scanWorkspace(vscode.workspace.workspaceFolders[0].uri.fsPath);
  }
}

export function deactivate() {}

class DevForgeWebviewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _registryService: RegistryService;

  constructor(
    private readonly _extensionUri: vscode.Uri,
  ) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    this._registryService = new RegistryService(workspaceFolder);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri
      ]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceFolder) {
        webviewView.webview.postMessage({
          command: `${data.command}.error`,
          libraryId: data.libraryId,
          error: 'No active workspace open. Please open a project first.'
        });
        return;
      }

      switch (data.command) {
        case 'project.get': {
          try {
            const scanData = await this.scanWorkspace(workspaceFolder);
            webviewView.webview.postMessage({
              command: 'project.get.success',
              data: scanData
            });
          } catch (err: any) {
            webviewView.webview.postMessage({
              command: 'project.get.error',
              error: err.message || 'Failed to scan repository.'
            });
          }
          break;
        }

        case 'library.install': {
          const { libraryId, ecosystem } = data;
          try {
            // Determine command based on project scanner results
            const scanData = await this.scanWorkspace(workspaceFolder);
            const installCmd = this.getInstallCommand(scanData, libraryId, ecosystem);

            webviewView.webview.postMessage({
              command: 'library.install.progress',
              libraryId,
              message: `Installing ${libraryId}...`
            });

            await this.executeShellCommand(installCmd, workspaceFolder);

            // Rescan project to update installed state
            const updatedScan = await this.scanWorkspace(workspaceFolder);
            webviewView.webview.postMessage({
              command: 'library.install.success',
              libraryId,
              data: updatedScan
            });
          } catch (err: any) {
            webviewView.webview.postMessage({
              command: 'library.install.error',
              libraryId,
              error: err.message || `Failed to install ${libraryId}`
            });
          }
          break;
        }

        case 'library.remove': {
          const { libraryId, ecosystem } = data;
          try {
            const scanData = await this.scanWorkspace(workspaceFolder);
            const uninstallCmd = this.getUninstallCommand(scanData, libraryId, ecosystem);

            webviewView.webview.postMessage({
              command: 'library.remove.progress',
              libraryId,
              message: `Removing ${libraryId}...`
            });

            await this.executeShellCommand(uninstallCmd, workspaceFolder);

            // Rescan project to update installed state
            const updatedScan = await this.scanWorkspace(workspaceFolder);
            webviewView.webview.postMessage({
              command: 'library.remove.success',
              libraryId,
              data: updatedScan
            });
          } catch (err: any) {
            webviewView.webview.postMessage({
              command: 'library.remove.error',
              libraryId,
              error: err.message || `Failed to remove ${libraryId}`
            });
          }
          break;
        }

        case 'registry.search': {
          const { query, ecosystems } = data;
          try {
            const results = await this._registryService.search(query, { ecosystems });
            webviewView.webview.postMessage({
              command: 'registry.search.success',
              results,
              query,
              ecosystems
            });
          } catch (err: any) {
            webviewView.webview.postMessage({
              command: 'registry.search.error',
              query,
              ecosystems,
              error: err.message || 'Registry search failed.'
            });
          }
          break;
        }

        case 'registry.get': {
          const { packageName, ecosystem } = data;
          try {
            const library = await this._registryService.getPackage(packageName, ecosystem);
            webviewView.webview.postMessage({
              command: 'registry.get.success',
              library,
              packageName,
              ecosystem
            });
          } catch (err: any) {
            webviewView.webview.postMessage({
              command: 'registry.get.error',
              packageName,
              ecosystem,
              error: err.message || 'Failed to fetch package details.'
            });
          }
          break;
        }

        case 'ai.ask': {
          const { query, mode } = data;
          try {
            const result = await this.askAI(query, mode, workspaceFolder);
            webviewView.webview.postMessage({
              command: 'ai.ask.success',
              data: result
            });
          } catch (err: any) {
            webviewView.webview.postMessage({
              command: 'ai.ask.error',
              error: err.message || 'AI request failed'
            });
          }
          break;
        }
      }
    });

    // Send workspace path upon connection to trigger initial load
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceFolder) {
      this.scanWorkspace(workspaceFolder)
        .then(scanData => {
          webviewView.webview.postMessage({
            command: 'project.get.success',
            data: scanData
          });
        })
        .catch(err => {
          webviewView.webview.postMessage({
            command: 'project.get.error',
            error: err.message || 'Failed to scan repository on startup.'
          });
        });
    }
  }

  public async scanWorkspace(repoPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ repository_path: repoPath });
      const options = {
        hostname: '127.0.0.1',
        port: 8000,
        path: '/scan',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.success) {
              resolve(parsed.data);
            } else {
              reject(new Error(parsed.error?.message || 'Scan failed on backend.'));
            }
          } catch (e) {
            reject(new Error('Failed to parse scan response from backend.'));
          }
        });
      });

      req.on('error', (e) => {
        reject(new Error(`FastAPI server not reachable on port 8000: ${e.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  private async askAI(query: string, mode: string, repoPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        mode,
        query,
        repository_path: repoPath
      });
      
      const options = {
        hostname: '127.0.0.1',
        port: 8000,
        path: '/ask',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.success) {
              resolve(parsed.data);
            } else {
              reject(new Error(parsed.error?.message || 'AI request failed on backend.'));
            }
          } catch (e) {
            reject(new Error('Failed to parse AI response.'));
          }
        });
      });

      req.on('error', (e) => {
        reject(new Error(`FastAPI server not reachable on port 8000: ${e.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  private getInstallCommand(scanData: any, libraryId: string, ecosystem?: string): string {
    const pkgManagers = scanData.package_managers || [];
    
    // Explicit ecosystem command mapping
    if (ecosystem === 'cargo') return `cargo add ${libraryId}`;
    if (ecosystem === 'nuget') return `dotnet add package ${libraryId}`;
    if (ecosystem === 'rubygems') return `gem install ${libraryId}`;
    if (ecosystem === 'packagist') return `composer require ${libraryId}`;
    if (ecosystem === 'pub') return `flutter pub add ${libraryId}`;
    if (ecosystem === 'pypi') return `.venv/bin/pip install ${libraryId}`;
    
    if (pkgManagers.includes('npm')) {
      return `npm install ${libraryId}`;
    }
    if (pkgManagers.includes('pnpm')) {
      return `pnpm add ${libraryId}`;
    }
    if (pkgManagers.includes('yarn')) {
      return `yarn add ${libraryId}`;
    }
    if (pkgManagers.includes('bun')) {
      return `bun add ${libraryId}`;
    }
    if (pkgManagers.includes('pip')) {
      return `.venv/bin/pip install ${libraryId}`;
    }
    if (pkgManagers.includes('cargo')) {
      return `cargo add ${libraryId}`;
    }
    // Fallback: Check if python requirements file is scanned
    if (scanData.languages?.includes('Python')) {
      return `pip install ${libraryId}`;
    }
    return `npm install ${libraryId}`;
  }

  private getUninstallCommand(scanData: any, libraryId: string, ecosystem?: string): string {
    const pkgManagers = scanData.package_managers || [];
    
    // Explicit ecosystem command mapping
    if (ecosystem === 'cargo') return `cargo remove ${libraryId}`;
    if (ecosystem === 'nuget') return `dotnet remove package ${libraryId}`; // or dotnet remove reference
    if (ecosystem === 'rubygems') return `gem uninstall ${libraryId}`;
    if (ecosystem === 'packagist') return `composer remove ${libraryId}`;
    if (ecosystem === 'pub') return `flutter pub remove ${libraryId}`;
    if (ecosystem === 'pypi') return `.venv/bin/pip uninstall -y ${libraryId}`;

    if (pkgManagers.includes('npm')) {
      return `npm uninstall ${libraryId}`;
    }
    if (pkgManagers.includes('pnpm')) {
      return `pnpm remove ${libraryId}`;
    }
    if (pkgManagers.includes('yarn')) {
      return `yarn remove ${libraryId}`;
    }
    if (pkgManagers.includes('bun')) {
      return `bun remove ${libraryId}`;
    }
    if (pkgManagers.includes('pip')) {
      return `.venv/bin/pip uninstall -y ${libraryId}`;
    }
    if (pkgManagers.includes('cargo')) {
      return `cargo remove ${libraryId}`;
    }
    if (scanData.languages?.includes('Python')) {
      return `pip uninstall -y ${libraryId}`;
    }
    return `npm uninstall ${libraryId}`;
  }

  private executeShellCommand(cmd: string, cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(cmd, { cwd }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || stdout || error.message));
        } else {
          resolve(stdout);
        }
      });
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const manifestPath = path.join(this._extensionUri.fsPath, 'webview-ui', 'dist', '.vite', 'manifest.json');
    let jsSrc = '';
    let cssSrc = '';

    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        const entry = manifest['index.html'] || manifest['src/main.tsx'];
        if (entry) {
          const jsFile = entry.file;
          const cssFiles = entry.css || [];
          
          jsSrc = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'webview-ui', 'dist', jsFile))).toString();
          if (cssFiles.length > 0) {
            cssSrc = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'webview-ui', 'dist', cssFiles[0]))).toString();
          }
        }
      } catch (e) {
        console.error('Error reading manifest file', e);
      }
    }

    // Fallback to direct build paths if manifest lookup fails
    if (!jsSrc) {
      jsSrc = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'webview-ui', 'dist', 'assets', 'index.js'))).toString();
    }
    if (!cssSrc) {
      cssSrc = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'webview-ui', 'dist', 'assets', 'index.css'))).toString();
    }

    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src ${webview.cspSource} http://127.0.0.1:8000 http://localhost:8000;">
        <link href="${cssSrc}" rel="stylesheet">
        <title>DevForge</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${jsSrc}"></script>
      </body>
      </html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
