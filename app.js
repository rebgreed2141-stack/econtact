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

const contactList = document.getElementById('contactList');
const imageViewer = document.getElementById('imageViewer');
const contactImage = document.getElementById('contactImage');

document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {

        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });

        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        button.classList.add('active');

        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

document.querySelectorAll('input[name="nursery"]').forEach(radio => {

    if (radio.value === nursery) {
        radio.checked = true;
    }

    radio.addEventListener('change', () => {
        nursery = radio.value;
        localStorage.setItem('nursery', nursery);
        loadChildren();
    });
});

document.getElementById('backButton').addEventListener('click', () => {
    imageViewer.classList.add('hidden');
    contactImage.src = '';
});

async function loadChildren() {

    const childFile = nursery === 'm'
        ? 'child_m.json'
        : 'child_y.json';

    const mapFile = nursery === 'm'
        ? 'contact_map_m.json'
        : 'contact_map_y.json';

    const imageFolder = nursery === 'm'
        ? 'images/m/'
        : 'images/y/';

    const childData = await fetch(childFile).then(r => r.json());
    const contactMap = await fetch(mapFile).then(r => r.json());

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

                const imageName = contactMap[child.id];

                if (!imageName) {
                    alert('画像がありません');
                    return;
                }

                const imagePath = imageFolder + imageName;

                try {

                    const response = await fetch(imagePath);

                    if (!response.ok) {
                        throw new Error();
                    }

                    contactImage.src = imagePath;
                    imageViewer.classList.remove('hidden');

                } catch {

                    alert('画像がありません');
                }
            });

            buttonArea.appendChild(button);
        });

        group.appendChild(title);
        group.appendChild(buttonArea);

        contactList.appendChild(group);
    });
}

loadChildren();
