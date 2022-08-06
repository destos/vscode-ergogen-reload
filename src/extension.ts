import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const panel = vscode.window.createWebviewPanel(
		"ergogenPreview", "ergogen", vscode.ViewColumn.Two, {}
	)

	let disposable = vscode.commands.registerCommand('ergogen-reload.preview', () => {
		// Open preview window with generated output of ergogen
		panel.reveal()
		const config = vscode.workspace.getConfiguration('ergogen-reload')
		const binaryLocation = config.get("ergogenBinary")

		// vscode.window.showInformationMessage('Buckarooo!');
		console.log(binaryLocation)
	})

	context.subscriptions.push(disposable)
}

export function deactivate() { }
