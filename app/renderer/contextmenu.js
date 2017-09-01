const {remote} = require('electron')
const {Menu, MenuItem} = remote

let rightClickPosition = null
const menu = new Menu()
menu.append(new MenuItem({ role: 'cut' }))
menu.append(new MenuItem({ role: 'copy' }))
menu.append(new MenuItem({ role: 'paste' }))
menu.append(new MenuItem({ role: 'selectall' }))
menu.append(new MenuItem({ type: 'separator' }))
menu.append(new MenuItem({
    label: 'Inspect',
    click: () => {
        remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y)
    }
}))

window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    rightClickPosition = {x: e.x, y: e.y};
    menu.popup(remote.getCurrentWindow())
}, false);