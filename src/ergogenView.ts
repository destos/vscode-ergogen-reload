import { exec } from "child_process";
import { tmpdir } from "os";
import * as path from "path";
import * as vscode from "vscode";
import {
  TextEditor,
  Uri,
  ViewColumn,
  WebviewPanel,
  WorkspaceConfiguration,
  ExtensionContext,
} from "vscode";

export class ErgogenPreviewView {
  private binaryLocation: string | undefined;

  /**
   * The key is ergogen config file fspath
   * value is Preview (vscode.WebviewPanel) object
   */
  private previewMaps: { [key: string]: WebviewPanel } = {};

  private preview2EditorMap: Map<WebviewPanel, TextEditor> = new Map();

  public constructor(
    private context: ExtensionContext,
    private config: WorkspaceConfiguration
  ) {
    this.binaryLocation = this.config.get("ergogenBinary", "ergogen");
  }

  /**
   * Format pathString if it is on Windows. Convert `c:\` like string to `C:\`
   * @param pathString
   */
  private formatPathIfNecessary(pathString: string) {
    if (process.platform === "win32") {
      pathString = pathString.replace(
        /^([a-zA-Z])\:\\/,
        (_, $1) => `${$1.toUpperCase()}:\\`
      );
    }
    return pathString;
  }

  private getProjectDirectoryPath(
    sourceUri: Uri,
    workspaceFolders: readonly vscode.WorkspaceFolder[] = []
  ) {
    const possibleWorkspaceFolders = workspaceFolders.filter(
      (workspaceFolder) => {
        return (
          path
            .dirname(sourceUri.path.toUpperCase())
            .indexOf(workspaceFolder.uri.path.toUpperCase()) >= 0
        );
      }
    );

    let projectDirectoryPath;
    if (possibleWorkspaceFolders.length) {
      // We pick the workspaceUri that has the longest path
      const workspaceFolder = possibleWorkspaceFolders.sort(
        (x, y) => y.uri.fsPath.length - x.uri.fsPath.length
      )[0];
      projectDirectoryPath = workspaceFolder.uri.fsPath;
    } else {
      projectDirectoryPath = "";
    }

    return this.formatPathIfNecessary(projectDirectoryPath);
  }

  private getFilePath(sourceUri: Uri) {
    return this.formatPathIfNecessary(sourceUri.fsPath);
  }

  public async initPreview(
    sourceUri: Uri,
    editor?: TextEditor,
    viewOptions?: { viewColumn: ViewColumn; preserveFocus?: boolean }
  ) {
    let panel: WebviewPanel;

    // TODO: manage existing previews and re-init them?

    const localResourceRoots = [
      Uri.file(this.context.extensionPath),
      // Uri.file(mume.utility.extensionDirectoryPath),
      // Uri.file(mume.getExtensionConfigPath()),
      Uri.file(tmpdir()),
      Uri.file(
        this.getProjectDirectoryPath(
          sourceUri,
          vscode.workspace.workspaceFolders
        ) || path.dirname(sourceUri.fsPath)
      ),
    ];

    panel = vscode.window.createWebviewPanel(
      "ergogen-preview",
      `ergogen ${path.basename(sourceUri.fsPath)}`,
      viewOptions ?? { viewColumn: ViewColumn.Beside },
      {
        // enableFindWidget: true
        localResourceRoots,
        enableScripts: true,
      }
    );

    panel.onDidDispose(() => {
      this.destroyPreview();
    });

    // register preview panel
    this.previewMaps[sourceUri.fsPath] = panel;
    if (editor) {
      this.preview2EditorMap.set(panel, editor);
    }
  }
  public update(uri: Uri) {
    console.log(uri);
  }

  private destroyPreview() {}
  // let resource = uri;
  // if (!(resource instanceof Uri)) {
}

export function isYamlFile(document: vscode.TextDocument) {
  return (
    document.languageId === "yaml" && document.uri.scheme !== "ergogen-preview"
  ); // prevent processing of own documents
}
