import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { TextEmbedder, FilesetResolver, TextEmbedderResult } from '@mediapipe/tasks-text'
// Remember to rename these classes and interfaces!
let textEmbedder: TextEmbedder;

// Before we can use TextEmbedder class we must wait for it to finish loading.
async function createEmbedder() {
	console.log("getting embedder")
	const textFiles = await FilesetResolver.forTextTasks(
		"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@0.10.0/wasm"
	);
	textEmbedder = await TextEmbedder.createFromOptions(textFiles, {
		baseOptions: {
			modelAssetPath: `https://storage.googleapis.com/mediapipe-models/text_embedder/universal_sentence_encoder/float32/1/universal_sentence_encoder.tflite`
		}
	});
	console.log("embedder ready")
	//demosSection.classList.remove("invisible");
}


interface ObsidianIaSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: ObsidianIaSettings = {
	mySetting: 'default'
}

export default class ObsidianIa extends Plugin {
	statusBarItemEl: HTMLSpanElement
	settings: ObsidianIaSettings;
	embeddings = {} as never;

	async onload(): Promise<void> {
		await this.loadSettings();

		await createEmbedder();
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.statusBarItemEl = this.addStatusBarItem().createEl("span")
		//this.statusBarItemEl.setText('Status Bar Text');
		this.readActiveFileAndUpdateLineCount()
		this.readActiveFileAndEmbed()
		this.embedVaultFiles()

		this.app.workspace.on('active-leaf-change', async () => {
			this.readActiveFileAndUpdateLineCount()
			this.readActiveFileAndEmbed()



			// const files = await this.app.vault.getFiles()
			// console.log("files", files)
			// for (let i = 0; i < files.length; i++) {
			// 	console.log("file", i, files[i].path);
			// }
		})

		this.app.workspace.on('editor-change', async editor => {
			const doc = editor.getDoc()
			console.log("DOC", doc)
			const content = doc.getValue()
			this.updateLineCount(content)
			const file = this.app.workspace.getActiveFile()
			if (file) this.updateEmbedding(file.path, content)

		})






		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Obsidian Ia', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');



		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	private updateLineCount(fileContent?: string) {
		const count = fileContent ? fileContent.split(/\r\n|\r|\n/).length : 0
		const linesWord = count === 1 ? "line" : "lines"
		this.statusBarItemEl.textContent = `${count} ${linesWord}`
	}

	private async updateEmbedding(filePath: string, fileContent: string) {
		console.log("embedding ", filePath, fileContent)
		// Wait to run the function until inner text is set
		await sleep(5);

		const embeddingResult: TextEmbedderResult = textEmbedder.embed(fileContent);
		this.embeddings[filePath] = embeddingResult
	}


	private async readActiveFileAndUpdateLineCount() {
		const file = this.app.workspace.getActiveFile()
		if (file) {
			const content = await this.app.vault.read(file)
			console.log(content)
			this.updateLineCount(content)
		}
		else {
			this.updateLineCount(undefined)
		}
	}

	private async readActiveFileAndEmbed() {
		const file = this.app.workspace.getActiveFile()
		console.log("File", file)
		if (file) {
			const content = await this.app.vault.read(file)
			console.log(content)
			this.updateEmbedding(file.path, content)
		}
		// else {
		// 	this.updateEmbedding("")
		// }
	}

	private async embedVaultFiles() {
		// const mdfiles = this.app.vault.getMarkdownFiles()
		// console.log('mdfiles', mdfiles)
		// for (let i = 0; i < mdfiles.length; i++) {
		// 	console.log("mdfile", i, mdfiles[i].path);
		// 	const id = mdfiles[i].path
		// 	let updateEmbedding()
		// 	this.embeddings[id] = {}
		// }
		const { vault } = this.app;

		const files: any = await Promise.all(
			vault.getMarkdownFiles().map((file) => { return { path: file.path, content: vault.cachedRead(file) } })
		);


		files.forEach(async (file: { path: string; content: string }) => {
			console.log(file.path, file.content)
			this.updateEmbedding(file.path, file.content)

		});

		console.log("embeddings", this.embeddings)
	}



	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: ObsidianIa;

	constructor(app: App, plugin: ObsidianIa) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
