const DB_NAME = 'EmergencyContactsDB';
const STORE_NAME = 'images';

const CLASS_ORDER = [
    'かもしか',
    'のうさぎ',
    'りす',
    'こぐま',
    'どんぐり',
    'もみじ'
];

const CLASS_COLOR = {
    'かもしか': 'kamoshika',
    'のうさぎ': 'nousagi',
    'りす': 'risu',
    'こぐま': 'koguma',
    'どんぐり': 'donguri',
    'もみじ': 'momiji'
};

let nursery = localStorage.getItem('nursery') || 'm';
let db = null;

const contactList = document.getElementById('contactList');
const imageViewer = document.getElementById('imageViewer');
const contactImage = document.getElementById('contactImage');
const folderInput = document.getElementById('folderInput');
const importButton = document.getElementById('importButton');

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = event => {
            const openedDb = event.target.result;
            if (!openedDb.objectStoreNames.contains(STORE_NAME)) {
                openedDb.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };

        request.onsuccess = event => {
            db = event.target.result;
            resolve();
        };

        request.onerror = () => reject(request.error);
    });
}

function makeImageKey(fileName) {
    return `${nursery}:${fileName}`;
}

function putImage(key, blob) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ key, blob });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

function getImage(key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getAllImageKeys() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function deleteImage(key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

document.querySelectorAll('input[name="nursery"]').forEach(radio => {
    if (radio.value === nursery) {
        radio.checked = true;
    }

    radio.addEventListener('change', async () => {
        nursery = radio.value;
        localStorage.setItem('nursery', nursery);
        await loadChildren();
    });
});

document.getElementById('backButton').addEventListener('click', () => {
    imageViewer.classList.add('hidden');

    if (contactImage.src.startsWith('blob:')) {
        URL.revokeObjectURL(contactImage.src);
    }

    contactImage.src = '';
});

importButton.addEventListener('click', () => {
    folderInput.value = '';
    folderInput.click();
});

folderInput.addEventListener('change', async event => {
    const files = Array.from(event.target.files)
        .filter(file => file.name.toLowerCase().endsWith('.jpg'));

    if (files.length === 0) {
        alert('jpgファイルがありません');
        return;
    }

    const currentKeys = [];
    let imported = 0;

    for (const file of files) {
        const key = makeImageKey(file.name);
        currentKeys.push(key);

        // Androidのフォルダー選択で同名画像の古い内容が残る場合があるため、
        // 既存データを削除し、画像をバイト列として読み直してから保存する。
        await deleteImage(key);
        const imageBytes = await file.arrayBuffer();
        const freshBlob = new Blob([imageBytes], {
            type: file.type || 'image/jpeg'
        });
        await putImage(key, freshBlob);
        imported++;
    }

    const allKeys = await getAllImageKeys();
    let deleted = 0;

    for (const key of allKeys) {
        if (!key.startsWith(`${nursery}:`)) continue;

        if (!currentKeys.includes(key)) {
            await deleteImage(key);
            deleted++;
        }
    }

    alert(`${imported}件取り込みました\n${deleted}件削除しました`);
});

async function loadChildren() {
    const childFile = nursery === 'm'
        ? 'child_m.json'
        : 'child_y.json';

    const childData = await fetch(childFile).then(response => response.json());

    contactList.innerHTML = '';

    CLASS_ORDER.forEach(className => {
        const children = childData.children.filter(child => child.className === className);
        if (children.length === 0) return;

        const group = document.createElement('div');
        group.className = 'class-group';

        const title = document.createElement('div');
        title.className = 'class-title';
        title.textContent = className;

        const buttonArea = document.createElement('div');
        buttonArea.className = 'child-buttons';

        children.forEach(child => {
            const button = document.createElement('button');
            button.className = `child-button ${CLASS_COLOR[className]}`;
            button.textContent = child.name;

            button.addEventListener('click', async () => {
                const fileName = `${child.id}.jpg`;
                const imageData = await getImage(makeImageKey(fileName));

                if (!imageData) {
                    alert('画像がありません');
                    return;
                }

                if (contactImage.src.startsWith('blob:')) {
                    URL.revokeObjectURL(contactImage.src);
                }

                contactImage.src = URL.createObjectURL(imageData.blob);
                imageViewer.classList.remove('hidden');
            });

            buttonArea.appendChild(button);
        });

        group.appendChild(title);
        group.appendChild(buttonArea);
        contactList.appendChild(group);
    });
}

(async () => {
    await openDB();
    await loadChildren();
})();
