import * as vscode from "vscode";
import { Uri, ViewColumn } from "vscode";
import { ErgogenPreviewView, isYamlFile } from "./ergogenView";

function getResource(uri?: Uri | undefined): Uri | undefined {
  if (!(uri instanceof vscode.Uri) && vscode.window.activeTextEditor) {
    return vscode.window.activeTextEditor.document.uri;
  }
  return uri;
}

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("ergogen-reload");
  const view = new ErgogenPreviewView(context, config);

  function openPreviewToSide(uri?: Uri) {
    const resource = getResource(uri);
    if (resource !== undefined) {
      view.initPreview(resource, vscode.window.activeTextEditor, {
        viewColumn: ViewColumn.Two,
        preserveFocus: true,
      });
    }
  }

  let disposable = vscode.commands.registerCommand(
    "ergogen-reload.preview",
    openPreviewToSide
  );

  context.subscriptions.push(disposable);

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (isYamlFile(document)) {
        view.update(document.uri);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (config.get("reloadOnChange", false) && isYamlFile(event.document)) {
        view.update(event.document.uri);
      }
    })
  );
}

export function deactivate() {}
