const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('node:path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    title: 'Meriz - EPSI Edition (Merise B1-B3)',
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    icon: path.join(__dirname, '../design/logo/png/meriz-icon-512.png'),
  })

  // Chargement du bundle de production Vite
  win.loadFile(path.join(__dirname, '../dist/index.html'))

  // Ne jamais bloquer la fermeture de la fenêtre (la croix "X") par beforeunload
  win.webContents.on('will-prevent-unload', (event) => {
    event.preventDefault()
  })

  // Ouvrir les liens externes dans le navigateur par défaut
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
