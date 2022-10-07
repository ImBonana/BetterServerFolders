/**
 * @name BetterServerFolders
 * @author Im_Banana#6112
 * @description Make The Server Folders Better!
 * @version 1.0.0
 * @authorId 635250116688871425
 * @website https://github.com/pronoob742/BetterServerFolders
 * @source https://github.com/pronoob742/BetterServerFolders
 * @updateUrl https://raw.githubusercontent.com/pronoob742/BetterServerFolders/main/BetterServerFolders.plugin.js
 */
/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();
@else@*/
module.exports = (() => {
    const config = {
        "info": {
            "name": "BetterServerFolders",
            "authors": [{
                "name": "Im_Banana",
                "discord_id": "635250116688871425",
                "github_username": "pronoob742"
            }],
            "version": "1.0.0",
            "description": "Make The Server Folders Better!",
            "github": "https://github.com/pronoob742/BetterServerFolders",
            "github_raw": "https://raw.githubusercontent.com/pronoob742/BetterServerFolders/main/BetterServerFolders.plugin.js"
        },
        "changelog": [
            // {
            //     "title": "New Stuff",
            //     "items": [
            //         "Add Sticker bypass. Not Working With Animated Stickers"
            //     ]
            // },
            // {
            //     "title": "Bugs Fixes",
            //     "type": "fixed",
            //     "items": [
            //         "Fix The Emoji Menu"
            //     ]
            // },
            // {
            //     "title": "Improvements",
            //     "type": "improved",
            //     "items": [
            //         "Improve The Code"
            //     ]
            // },
            // {
            //     "title": "On-going",
            //     "type": "progress",
            //     "items": [
            //         "Animated Stickers Will Be In The Next Update!"
            //     ]
            // }
        ],
        "main": "BetterServerFolders.plugin.js"
    };

    return !global.ZeresPluginLibrary ? class {
        constructor() {
            this._config = config;
        }
        getName() {
            return config.info.name;
        }
        getAuthor() {
            return config.info.authors.map(a => a.name).join(", ");
        }
        getDescription() {
            return config.info.description;
        }
        getVersion() {
            return config.info.version;
        }
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
            const {
                Patcher,
                DiscordModules,
                DiscordAPI,
                Settings,
                Toasts,
                PluginUtilities
            } = Api;

            async function setTextInTextBox(text) {
                const ComponentDispatch = BdApi.Webpack.getModule(m => m.dispatchToLastSubscribed && m.emitter.listeners("INSERT_TEXT").length) 

                await ComponentDispatch.dispatchToLastSubscribed("INSERT_TEXT", {
                    plainText: `${text}`
                });
            }

            return class NitroPerks extends Plugin {
                defaultSettings = {
                    backgroundColor: "#2c2c2c",
                    folderColor: false
                };
                settings = PluginUtilities.loadSettings(this.getName(), this.defaultSettings);
                getSettingsPanel() {
                    return Settings.SettingPanel.build(_ => this.saveAndUpdate(), ...[
                        new Settings.Switch("folderBackgroundColor", "Set the color of the background to the folder color", this.settings.folderColor, check => this.settings.folderColor = check),
                        new Settings.ColorPicker("backgroundColor", "Set the color of the background when the folder is open", this.settings.backgroundColor, color => this.settings.backgroundColor = color, )
                    ])
                }
                
                saveAndUpdate() {
                    PluginUtilities.saveSettings(this.getName(), this.settings)
                }

                onStart() {
                    this.saveAndUpdate()
                }

                onStop() {
                    Patcher.unpatchAll();
                }
            };
        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
