export function setupGlobalDragAndDrop(
    onFiles: (files: FileList) => void,
    onActiveChange: (active: boolean) => void
): () => void {
    let counter = 0
    const enter = (e: DragEvent) => {
        if (e.dataTransfer?.types.includes('Files')) {
            counter++
            onActiveChange(true)
        }
    }
    const leave = () => {
        counter--
        if (counter <= 0) {
            counter = 0
            onActiveChange(false)
        }
    }
    const over = (e: DragEvent) => {
        if (e.dataTransfer?.types.includes('Files')) e.preventDefault()
    }
    const drop = (e: DragEvent) => {
        e.preventDefault()
        counter = 0
        onActiveChange(false)
        if (e.dataTransfer?.files) onFiles(e.dataTransfer.files)
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', over)
    window.addEventListener('drop', drop)
    return () => {
        window.removeEventListener('dragenter', enter)
        window.removeEventListener('dragleave', leave)
        window.removeEventListener('dragover', over)
        window.removeEventListener('drop', drop)
    }
}

export function setupCtrlVHandler(onPaste: () => void): () => void {
    function onKeyDown(e: KeyboardEvent) {
        if (!(e.key === 'v' && (e.ctrlKey || e.metaKey))) return
        const tag = (document.activeElement?.tagName ?? '').toLowerCase()
        if (['input', 'textarea', 'select'].includes(tag)) return
        e.preventDefault()
        onPaste()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
}
