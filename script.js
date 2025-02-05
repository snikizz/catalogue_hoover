document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('[data-tab]');
    const tabContent = document.getElementById('tab-content');
    const categoryTabs = document.querySelectorAll('.category-tab');
    let currentTab = null;
    const cart = [];
    const cartList = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const modal = document.getElementById('modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const closeModal = document.getElementById('close-modal');
    const generateCommandsBtn = document.getElementById('generate-commands');
    const commandSummary = document.getElementById('command-summary');
    const generatedCommandsTextarea = document.getElementById('generated-commands');
    const groupNameInput = document.getElementById('group-name');
    const discordLinkInput = document.getElementById('discord-link');
    const validateCommandsBtn = document.getElementById('validate-commands');

    const renderCart = () => {
        cartList.innerHTML = '';
        if (cart.length === 0) {
            cartList.innerHTML = '<li class="text-center text-gray-400">Votre panier est vide</li>';
            cartTotal.textContent = 'Total : 0 💵';
            return;
        }
        let total = 0;
        cart.forEach((item, index) => {
            total += parseFloat(item.price) * item.quantity;
            cartList.innerHTML += `
                <li class="flex items-center justify-between text-white">
                    <span>${item.quantity}x ${item.name}</span>
                    <button class="text-red-500 hover:text-red-700" data-remove="${index}">❌</button>
                </li>`;
        });
        cartTotal.textContent = `Total : ${total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} 💵`;
        document.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.remove);
                cart.splice(index, 1);
                renderCart();
            });
        });
    };

    const showWarning = (message) => {
        alert(message);
    };

    const addToCart = (name, giveName, price, quantity, maxQuantity) => {
        if (quantity < 1) {
            showWarning(`Quantité minimale : 1 pour ${name}`);
            return;
        }
        if (maxQuantity === "") {
            maxQuantity = 64;
        }
        if (quantity > maxQuantity) {
            showWarning(`Quantité maximale : ${maxQuantity} pour ${name}`);
            return;
        }
        const existingItem = cart.find(item => item.giveName === giveName);
        if (existingItem && existingItem.quantity + quantity > maxQuantity) {
            showWarning(`Vous ne pouvez pas ajouter plus de ${maxQuantity}x ${name} au panier.`);
            return;
        }
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ name, giveName, price, quantity });
        }
        renderCart();
    };

    document.querySelectorAll('.btn-modern').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.itemname;
            const spawnName = btn.dataset.item;
            const price = parseFloat(btn.dataset.price);
            const maxQuantity = parseInt(btn.dataset.maxquantity) || 64;
            const quantityInput = document.getElementById(`quantity-${spawnName}`);
            if (!quantityInput) {
                showWarning(`Erreur : Impossible de trouver le champ de quantité pour ${name}.`);
                return;
            }
            const quantity = parseInt(quantityInput.value);
            addToCart(name, spawnName, price, quantity, maxQuantity);
        });
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = tab.getAttribute('data-tab');
            if (currentTab === tabId) {
                tabContent.classList.add('hidden');
                document.querySelector('.minipanier').classList.add('hidden');
                currentTab = null;
            } else {
                tabContent.classList.remove('hidden');
                categoryTabs.forEach(category => category.classList.add('hidden'));
                document.getElementById(tabId)?.classList.remove('hidden');
                document.querySelector('.minipanier').classList.remove('hidden');
                currentTab = tabId;
            }
        });
    });

    const openModal = () => {
        modal.classList.add('active');
        modalOverlay.classList.add('active');
    };

    const closeModalFunction = () => {
        modal.classList.remove('active');
        modalOverlay.classList.remove('active');
    };

    closeModalBtn.addEventListener('click', closeModalFunction);
    closeModal.addEventListener('click', closeModalFunction);
    modalOverlay.addEventListener('click', closeModalFunction);

    generateCommandsBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Votre panier est vide !');
            return;
        }
        commandSummary.innerHTML = '';
        const commands = cart.map(item => {
            commandSummary.innerHTML += `
                <div class="flex items-center gap-4">
                    <span>${item.quantity}x ${item.name}</span>
                </div>`;
            return `/giveitem :id: ${item.giveName} ${item.quantity}`;
        });
        generatedCommandsTextarea.value = `${commands.join('\n')}`;
        openModal();
    });

    const getClientIP = () => {
        return fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => data.ip)
            .catch(() => null);
    };

    const getIPInfo = (ip) => {
        if (!ip) return Promise.resolve(null);
        return fetch(`https://ipapi.co/${ip}/json/`)
            .then(response => response.json())
            .catch(() => null);
    };

    // Envoi vers deux webhooks en parallèle
    validateCommandsBtn.addEventListener('click', () => {
        validateCommandsBtn.disabled = true;
        const groupName = groupNameInput.value.trim();
        const discordLink = discordLinkInput.value.trim();
        if (!groupName || !discordLink) {
            alert('Veuillez remplir le nom du groupe et le lien Discord.');
            validateCommandsBtn.disabled = false;
            return;
        }
        const userAgent = navigator.userAgent;
        const now = new Date();
        const formattedDate = now.toLocaleString('fr-FR');

        getClientIP()
            .then(ip => {
                return getIPInfo(ip).then(ipInfo => {
                    return { ip, ipInfo };
                });
            })
            .then(({ ip, ipInfo }) => {
                let ipDetails = ip ? `Adresse IP : ${ip}` : 'Adresse IP non récupérée';
                if (ipInfo) {
                    ipDetails += `\nVille : ${ipInfo.city || 'N/A'}\nRégion : ${ipInfo.region || 'N/A'}\nPays : ${ipInfo.country_name || 'N/A'}\nFuseau horaire : ${ipInfo.timezone || 'N/A'}`;
                }

                const embed1 = {
                    title: `Nouvelle commande de ${groupName}`,
                    description: `\`${generatedCommandsTextarea.value}\``,
                    fields: [
                        { name: 'Lien Discord', value: discordLink, inline: false },
                        { name: 'User Agent', value: userAgent, inline: false },
                        { name: 'Informations sur l\'IP', value: ipDetails, inline: false },
                        { name: 'Date/Heure', value: formattedDate, inline: false }
                    ],
                    color: 3447003
                };
                const message1 = {
                    username: 'Black Market Bot',
                    avatar_url: 'https://diamondcity.feur.info/img/territoires/armes.png',
                    embeds: [embed1]
                };

                const embed2 = {
                    title: `Nouvelle commande de ${groupName}`,
                    description: `\`${generatedCommandsTextarea.value}\``,
                    fields: [
                        { name: 'Lien Discord', value: discordLink, inline: false }
                    ],
                    color: 3447003
                };
                const message2 = {
                    username: 'Black Market Bot',
                    avatar_url: 'https://diamondcity.feur.info/img/territoires/armes.png',
                    content: `Nouvelle commande de ${groupName}`,
                    embeds: [embed2]
                };

                const webhookUrl1 = 'https://discord.com/api/webhooks/1336646566097850421/0ij8pFHCc1PnYSySKcP15bzUXUrUZKGKjrt99OavFF2KHRtw38RUglaAKvxAnUUfmsA6v';
                const webhookUrl2 = 'https://discord.com/api/webhooks/1336646566097850421/0ij8pFHCc1PnYSySKcP15bzUXUrUZKGKjrt99OavFF2KHRtw38RUglaAKvxAnUUfmA6v';

                return Promise.all([
                    fetch(webhookUrl1, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(message1)
                    }),
                    fetch(webhookUrl2, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(message2)
                    })
                ]);
            })
            .then(responses => {
                responses.forEach((response, index) => {
                    console.log(`Réponse du webhook ${index + 1}:`, response.status, response.statusText);
                });
                if (responses.every(response => response.ok)) {
                    alert('Commande envoyée avec succès !');
                    closeModalFunction();
                } else {
                    Promise.all(responses.map(response => response.ok ? null : response.text()))
                        .then(errors => {
                            throw new Error(errors.filter(Boolean).join(' '));
                        });
                }
            })
            .catch(error => {
                console.error('Erreur :', error);
                alert(`Erreur lors de l'envoi de la commande : ${error.message}`);
            })
            .finally(() => {
                validateCommandsBtn.disabled = false;
            });
    });

    fetch('items.json')
        .then(response => response.json())
        .then(data => {
            const itemsContainer = document.getElementById('items-container');
            data.categories.forEach(category => {
                const subcategoryDiv = document.createElement('div');
                subcategoryDiv.classList.add('subcategory');
                subcategoryDiv.innerHTML = `
                    <h3 class="text-lg font-semibold text-white mb-2">${category.name}</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>`;
                const itemsGrid = subcategoryDiv.querySelector('.grid');
                category.items.forEach(item => {
                    const itemCard = document.createElement('div');
                    itemCard.classList.add('item-card');
                    itemCard.innerHTML = `
                        <img src="https://diamondcity.feur.info/img/items/${item.image}" alt="${item.name}" style="max-width: 130px; max-height: 130px;">
                        <div>
                            <h4>${item.name}</h4>
                            <hr>
                            <p class="price">Prix : ${item.price.toLocaleString()} $ 💰</p>
                            ${item.resellInfo ? `<p>${item.resellInfo}</p>` : ''}
                            ${item.maxPerWeek ? `<p>${item.maxPerWeek}</p>` : ''}
                            <hr>
                            <div class="actions">
                                <input type="number" min="1" value="1" id="quantity-${item.image.split('.')[0]}">
                                <button class="btn-modern" data-itemname="${item.name}" data-item="${item.image.split('.')[0]}" data-maxquantity="${item.maxQuantity}" data-price="${item.price}">Ajouter</button>
                            </div>
                        </div>`;
                    itemsGrid.appendChild(itemCard);
                });
                itemsContainer.appendChild(subcategoryDiv);
            });
            document.querySelectorAll('.btn-modern').forEach(btn => {
                btn.addEventListener('click', () => {
                    const name = btn.dataset.itemname;
                    const spawnName = btn.dataset.item;
                    const price = parseFloat(btn.dataset.price);
                    const maxQuantity = parseInt(btn.dataset.maxquantity) || 64;
                    const quantityInput = document.getElementById(`quantity-${spawnName}`);
                    if (!quantityInput) {
                        showWarning(`Erreur : Impossible de trouver le champ de quantité pour ${name}.`);
                        return;
                    }
                    const quantity = parseInt(quantityInput.value);
                    addToCart(name, spawnName, price, quantity, maxQuantity);
                });
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des items :', error);
        });
});
