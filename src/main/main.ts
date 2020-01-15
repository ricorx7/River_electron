/**
 * Entry point of the Election app.
 */
import { app, BrowserWindow, ipcMain, dialog, Menu, MenuItem } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { func } from 'prop-types';
var zerorpc = require('zerorpc');

let mainWindow: Electron.BrowserWindow | null;
let adcpTerminalWindow: Electron.BrowserWindow | null;

function createWindow(): void {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        height: 1200,
        width: 1600,
        webPreferences: {
            webSecurity: false,
            devTools: process.env.NODE_ENV === 'production' ? false : true,
            //enableRemoteModule: true,
            nodeIntegration: true,
            nativeWindowOpen: true
        }
    });

    // Load the index.html of the app.
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, './index.html'),
            protocol: 'file:',
            slashes: true
        })
    );

    // Display devtools in the app
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// Create the ADCP Terminal Window
function createAdcpTerminalWindow(): void {
    // ADCP Terminal Window
    adcpTerminalWindow = new BrowserWindow({
        height: 300,
        width: 300,
        show: false
    });
    adcpTerminalWindow.loadURL(
        //url.format({
        //    //pathname: path.join(__dirname, './adcp_terminal'),
        //    //protocol: 'file:',
        //    pathname: '#adcp-terminal',
        //    //slashes: true
        //})
        //'http://localhost:3000/adcp_terminal'
        `file://${path.join(__dirname, 'index.html#/adcp_terminal')}`
        //'#adcp-terminal'

    );
    adcpTerminalWindow.on('close', () => {
        adcpTerminalWindow = null;
    })
}

// Menu Items
const template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Create Discharge Measurement',
                accelerator: 'CmdOrCtrl+C'
                //click() {
                //    if(mainWindow != null)
                //    {
                        // Load the index.html of the app.
                //        mainWindow.loadURL(
                        //    url.format({
                        //        pathname: path.join(__dirname, './index.html#/configure'),
                        //        protocol: 'file:',
                        //        slashes: true
                        //    })
                //        `file://${path.join(__dirname, './index.html#/configure')}`);
                        //);
                //    }
                //}
            },
            {
                label: 'Add Transect',
                accelerator: 'CmdOrCtrl+A'
            },
            {
                type: 'separator'
             },
            {
                label: 'Exit', 
                click() { 
                    app.quit() 
                } 
            }
        ]
    },
    {
       label: 'Edit',
       submenu: [
          {
             role: 'undo'
          },
          {
             role: 'redo'
          },
          {
             type: 'separator'
          },
          {
             role: 'cut'
          },
          {
             role: 'copy'
          },
          {
             role: 'paste'
          }
       ]
    },
    
    {
       label: 'View',
       submenu: [
          {
             role: 'reload'
          },
          {
             role: 'toggledevtools'
          },
          {
             type: 'separator'
          },
          {
             role: 'resetzoom'
          },
          {
             role: 'zoomin'
          },
          {
             role: 'zoomout'
          },
          {
             type: 'separator'
          },
          {
             role: 'togglefullscreen'
          }
       ]
    },
    
    {
       role: 'window',
       submenu: [
          {
             role: 'minimize'
          },
          {
             role: 'close'
          }
       ]
    },
    
    {
       role: 'help',
       submenu: [
          {
             label: 'Learn More'
          }
       ]
    }
 ]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it"s common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});


// Open the ADCP Terminal Window when message received
ipcMain.on('show-adcp-terminal', function () {
    // Create the window if it does not exist
    if(adcpTerminalWindow == null)
    {
        createAdcpTerminalWindow();
    }

    // Open the window
    if(adcpTerminalWindow != null)
    {
        adcpTerminalWindow.show()
    }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.


// Create the zerorpc connection to the python server
// Use the port given to create the port
var client = new zerorpc.Client();
var zerorpcIP = "tcp://127.0.0.1:4241";
client.connect(zerorpcIP);

// Open File dialog called by
ipcMain.on('open-file-dialog', (event: Electron.Event) => {
    dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections']
    }, (files) => {
      if (files) {
        // Send ther responds back to the VM on the files selected
        event.sender.send('selected-directory', files)

        // Call to python to playback the selected files
        client.invoke("zerorpc_playback_files", files, function(error: string, playback_status: string, more: string) {
            console.log(playback_status)
        });

      }
    })
  })

// Open File dialog called by
//ipcMain.on('open-file-dialog', (event: Electron.Event) => {
//    if(mainWindow != null)
//    {
//        dialog.showOpenDialog(mainWindow, {
//        properties: ['openFile', 'multiSelections']
//        }).then(files => {
//        if (files) {
//            (<any>event).sender.send('selected-directory', files)
//        }
//        })
//    }
//})

