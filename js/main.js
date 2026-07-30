(function () {
    'use strict';

    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
            return;
        }
        callback();
    }

    function closest(element, selector) {
        return element && element.closest ? element.closest(selector) : null;
    }

    function wrapImage(image) {
        var parent = image.parentElement;
        if (!parent || parent.tagName === 'A' || parent.classList.contains('gallery-item')) return;

        var link = document.createElement('a');
        link.href = image.currentSrc || image.src;
        link.title = image.alt || '';
        link.className = 'gallery-item';
        parent.insertBefore(link, image);
        link.appendChild(image);
    }

    function addCaption(image) {
        if (!image.alt || closest(image, '.article-gallery')) return;
        var next = image.nextElementSibling;
        if (next && next.classList.contains('caption')) return;

        var caption = document.createElement('span');
        caption.className = 'caption';
        caption.textContent = image.alt;
        image.insertAdjacentElement('afterend', caption);
    }

    function setupImages() {
        document.querySelectorAll('.article-entry img').forEach(function (image) {
            addCaption(image);
            wrapImage(image);
        });
    }

    function createLightbox() {
        var lightbox = document.createElement('div');
        var closeButton = document.createElement('button');
        var image = document.createElement('img');
        var caption = document.createElement('div');

        lightbox.className = 'wikiflow-lightbox';
        lightbox.setAttribute('aria-hidden', 'true');
        closeButton.type = 'button';
        closeButton.className = 'wikiflow-lightbox-close';
        closeButton.setAttribute('aria-label', 'Close image');
        closeButton.textContent = String.fromCharCode(215);
        image.className = 'wikiflow-lightbox-image';
        image.alt = '';
        caption.className = 'wikiflow-lightbox-caption';
        lightbox.appendChild(closeButton);
        lightbox.appendChild(image);
        lightbox.appendChild(caption);
        document.body.appendChild(lightbox);
        return lightbox;
    }

    function setupLightbox() {
        var enabled = !document.documentElement.hasAttribute('data-gallery-disabled');
        if (!enabled) return;

        var lightbox = createLightbox();
        var image = lightbox.querySelector('.wikiflow-lightbox-image');
        var caption = lightbox.querySelector('.wikiflow-lightbox-caption');

        function close() {
            lightbox.classList.remove('is-open');
            lightbox.setAttribute('aria-hidden', 'true');
            image.removeAttribute('src');
            document.body.classList.remove('wikiflow-lightbox-open');
        }

        document.addEventListener('click', function (event) {
            var trigger = closest(event.target, '.gallery-item');
            if (!trigger) return;
            event.preventDefault();

            var triggerImage = trigger.querySelector('img');
            image.src = trigger.href;
            image.alt = triggerImage ? triggerImage.alt : '';
            caption.textContent = trigger.title || image.alt || '';
            caption.hidden = !caption.textContent;
            lightbox.classList.add('is-open');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.classList.add('wikiflow-lightbox-open');
        });

        lightbox.addEventListener('click', function (event) {
            if (event.target === lightbox || closest(event.target, '.wikiflow-lightbox-close')) {
                close();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && lightbox.classList.contains('is-open')) close();
        });
    }

    function setupProfileCard() {
        var profile = document.getElementById('profile');
        var anchor = document.getElementById('profile-anchor');
        if (!profile || !anchor) return;

        function setExpanded(expanded) {
            profile.classList.toggle('card', expanded);
            anchor.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        }

        document.addEventListener('click', function () {
            setExpanded(false);
        });
        anchor.addEventListener('click', function (event) {
            event.stopPropagation();
            setExpanded(!profile.classList.contains('card'));
        });
        var inner = profile.querySelector('.profile-inner');
        if (inner) {
            inner.addEventListener('click', function (event) {
                event.stopPropagation();
            });
        }
    }

    function setupMobileMenu() {
        var trigger = document.getElementById('mobile-menu-trigger');
        var panel = document.getElementById('mobile-menu-panel');
        if (!trigger || !panel) return;

        function setExpanded(expanded) {
            panel.hidden = !expanded;
            trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        }

        trigger.addEventListener('click', function (event) {
            event.stopPropagation();
            setExpanded(panel.hidden);
        });

        panel.addEventListener('click', function (event) {
            if (closest(event.target, 'a')) setExpanded(false);
        });

        document.addEventListener('click', function (event) {
            if (panel.hidden || closest(event.target, '#mobile-menu-panel') || closest(event.target, '#mobile-menu-trigger')) return;
            setExpanded(false);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !panel.hidden) {
                setExpanded(false);
                trigger.focus();
            }
        });
    }

    function setupMobileWidgets() {
        var mobileQuery = window.matchMedia('(max-width: 799px)');
        var toggles = Array.prototype.slice.call(document.querySelectorAll('.widget-mobile-toggle'));
        if (!toggles.length) return;

        function setWidget(toggle, expanded) {
            var widget = closest(toggle, '.widget-wrap');
            if (!widget) return;
            widget.classList.toggle('is-collapsed', !expanded);
            toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        }

        function syncInitialState() {
            toggles.forEach(function (toggle) {
                setWidget(toggle, !mobileQuery.matches);
            });
        }

        toggles.forEach(function (toggle) {
            toggle.addEventListener('click', function () {
                var expanded = toggle.getAttribute('aria-expanded') === 'true';
                setWidget(toggle, !expanded);
            });
        });

        if (typeof mobileQuery.addEventListener === 'function') {
            mobileQuery.addEventListener('change', syncInitialState);
        } else if (typeof mobileQuery.addListener === 'function') {
            mobileQuery.addListener(syncInitialState);
        }
        syncInitialState();
    }

    function copyText(text) {
        function fallbackCopy() {
            return new Promise(function (resolve, reject) {
                var textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'fixed';
                textarea.style.top = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    resolve();
                } catch (error) {
                    reject(error);
                } finally {
                    document.body.removeChild(textarea);
                }
            });
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).catch(fallbackCopy);
        }

        return fallbackCopy();
    }

    function codeTextFromBlock(block) {
        var code = block.querySelector('td.code pre') ||
            block.querySelector('.code pre') ||
            block.querySelector('pre code') ||
            block.querySelector('pre');
        if (!code) return '';
        return code.innerText.replace(/\n$/, '');
    }

    function wrapCodeBlock(block) {
        var wrapper;
        if (block.parentElement && block.parentElement.classList.contains('code-container')) {
            return block.parentElement;
        }

        wrapper = document.createElement('div');
        wrapper.className = 'code-container notranslate';
        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(block);
        return wrapper;
    }

    function createCopyIcon(className) {
        var icon = document.createElement('i');
        icon.className = className;
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    }

    function setCopyState(button, className) {
        button.textContent = '';
        button.appendChild(createCopyIcon(className));
    }

    function setupHighlightClasses() {
        document.querySelectorAll('.article-entry .highlight').forEach(function (block) {
            block.querySelectorAll('.code .line span, code.highlight span').forEach(function (token) {
                Array.prototype.slice.call(token.classList).forEach(function (name) {
                    if (name === 'line' || name.indexOf('hljs-') === 0) return;
                    token.classList.add('hljs-' + name);
                });
            });
        });
    }

    function setupCodeCopy() {
        document.querySelectorAll('.article-entry .highlight').forEach(function (block, index) {
            var button;
            var icon;
            var status;
            var wrapper;
            if (block.classList.contains('code-copy-ready')) return;

            block.classList.add('code-copy-ready');
            wrapper = wrapCodeBlock(block);
            button = document.createElement('button');
            status = document.createElement('span');
            icon = createCopyIcon('fa-solid fa-copy fa-fw');
            button.type = 'button';
            button.className = 'copy-btn';
            button.setAttribute('aria-label', 'Copy code');
            button.appendChild(icon);
            status.className = 'code-copy-status';
            status.id = 'code-copy-status-' + index;
            status.setAttribute('aria-live', 'polite');
            button.setAttribute('aria-describedby', status.id);
            wrapper.appendChild(status);
            wrapper.appendChild(button);

            button.addEventListener('click', function () {
                copyText(codeTextFromBlock(block)).then(function () {
                    setCopyState(button, 'fa-solid fa-circle-check fa-fw');
                    status.textContent = 'Code copied';
                    window.setTimeout(function () {
                        setCopyState(button, 'fa-solid fa-copy fa-fw');
                        status.textContent = '';
                    }, 1800);
                }).catch(function () {
                    setCopyState(button, 'fa-solid fa-circle-xmark fa-fw');
                    status.textContent = 'Copy failed';
                    window.setTimeout(function () {
                        setCopyState(button, 'fa-solid fa-copy fa-fw');
                        status.textContent = '';
                    }, 1800);
                });
            });
        });
    }

    function setupToTop() {
        var sidebar = document.getElementById('sidebar');
        var toTop = document.getElementById('toTop');
        if (!sidebar || !toTop) return;

        var threshold = sidebar.offsetHeight - window.innerHeight + 60;
        function update() {
            if (document.documentElement.clientWidth >= 800 && window.scrollY > threshold && window.scrollY > 0) {
                toTop.style.display = 'block';
                toTop.style.left = sidebar.getBoundingClientRect().left + window.scrollX + 'px';
            } else {
                toTop.style.display = 'none';
            }
        }

        document.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', function () {
            threshold = sidebar.offsetHeight - window.innerHeight + 60;
            update();
        });
        toTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function setupTaskLists() {
        document.querySelectorAll('.article-entry ul > li').forEach(function (item) {
            var text = item.textContent.trim();
            var checked = /^\[x\]/i.test(text);
            var unchecked = /^\[ \]/.test(text);
            var checkbox;
            if (!checked && !unchecked) return;

            item.classList.add('task-list');
            if (checked) item.classList.add('check');
            checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.disabled = true;
            checkbox.checked = checked;

            if (item.firstChild && item.firstChild.nodeType === Node.TEXT_NODE) {
                item.firstChild.nodeValue = item.firstChild.nodeValue.replace(/^\s*\[(?: |x)\]\s*/i, '');
            }
            item.insertBefore(checkbox, item.firstChild);
        });
    }

    function setupCategoryTree() {
        var categories = document.getElementById('categories');
        var body;
        var external;
        var treeSource;
        var rootUrl;
        var currentPath;
        var loadingPromise;
        var loadedTree;
        var renderedTree = false;
        var branchByDirectory = typeof WeakMap === 'function' ? new WeakMap() : null;
        var iconFolderOpenClass = 'fa-folder-open';
        var iconFolderCloseClass = 'fa-folder';
        var iconAllExpandClass = 'fa-angles-down';
        var iconAllPackClass = 'fa-angles-up';

        if (!categories) return;

        body = document.getElementById('categories-body');
        external = categories.getAttribute('data-category-mode') === 'external';
        treeSource = categories.getAttribute('data-tree-src') || '';
        rootUrl = categories.getAttribute('data-root-url') || '/';
        currentPath = normalizePath(categories.getAttribute('data-current-path') || window.location.pathname);

        function safeDecode(value) {
            try {
                return decodeURIComponent(value);
            } catch {
                return value;
            }
        }

        function normalizedRoot() {
            var root = safeDecode(rootUrl || '/').split('#')[0].split('?')[0];
            if (root.charAt(0) !== '/') root = '/' + root;
            if (root.length > 1 && root.slice(-1) !== '/') root += '/';
            return root;
        }

        function normalizePath(value) {
            var path = String(value || '');
            var root = normalizedRoot();

            try {
                path = new URL(path, window.location.origin).pathname;
            } catch {
                path = path.split('#')[0].split('?')[0];
            }

            path = safeDecode(path).replace(/\\/g, '/');
            if (root !== '/' && path.indexOf(root) === 0) path = '/' + path.slice(root.length);
            path = path.replace(/^\/+/, '');
            path = path.replace(/(?:^|\/)index\.html?$/i, '');
            path = path.replace(/\/+$/, '');
            return path;
        }

        function withRoot(path) {
            var value = String(path || '');
            var root = rootUrl || '/';

            if (/^(?:[a-z]+:)?\/\//i.test(value) || value.charAt(0) === '/') return value || '/';
            if (root.slice(-1) !== '/') root += '/';
            return root + value.replace(/^\/+/, '');
        }

        function getBranch(directory) {
            if (branchByDirectory) return branchByDirectory.get(directory);
            return directory.wikiflowBranch;
        }

        function setBranchData(directory, branch) {
            if (branchByDirectory) {
                branchByDirectory.set(directory, branch);
                return;
            }
            directory.wikiflowBranch = branch;
        }

        function nodeHasChildren(branch) {
            return !!(branch && ((branch.children && branch.children.length) || (branch.articles && branch.articles.length)));
        }

        function markSelected(branch) {
            var selected = false;

            if (!branch) return false;

            (branch.articles || []).forEach(function (post) {
                post.selected = normalizePath(post.path) === currentPath;
                if (post.selected) selected = true;
            });

            (branch.children || []).forEach(function (child) {
                if (markSelected(child)) selected = true;
            });

            branch.selected = selected;
            return selected;
        }

        function removeLoadingState() {
            if (!body) return;
            body.removeAttribute('aria-busy');
            body.querySelectorAll('[data-role="category-tree-status"]').forEach(function (status) {
                status.remove();
            });
        }

        function showFallback() {
            var fallbackUrl = categories.getAttribute('data-fallback-url') || '/categories/';
            var fallbackLabel = categories.getAttribute('data-fallback-label') || 'Categories';
            var paragraph;
            var link;

            if (!body || body.querySelector('.category-tree-fallback')) return;

            removeLoadingState();
            paragraph = document.createElement('p');
            link = document.createElement('a');
            paragraph.className = 'category-tree-fallback';
            link.href = fallbackUrl;
            link.textContent = fallbackLabel;
            paragraph.appendChild(link);
            body.appendChild(paragraph);
        }

        function setFolderIcon(icon, expanded) {
            if (!icon) return;
            icon.classList.remove(iconFolderOpenClass, iconFolderCloseClass);
            icon.classList.add(expanded ? iconFolderOpenClass : iconFolderCloseClass);
        }

        function setAllIcon(icon, expanded) {
            if (!icon) return;
            icon.classList.remove(iconAllExpandClass, iconAllPackClass);
            icon.classList.add(expanded ? iconAllPackClass : iconAllExpandClass);
        }

        function createIcon(className) {
            var icon = document.createElement('i');
            icon.className = className;
            icon.setAttribute('aria-hidden', 'true');
            return icon;
        }

        function createFile(post) {
            var item = document.createElement('li');
            var link = document.createElement('a');

            item.className = 'file';
            if (post.selected) item.classList.add('active');
            link.href = withRoot(post.path);
            link.textContent = post.title || '';
            item.appendChild(link);
            return item;
        }

        function createTree(branch, renderDescendants) {
            var list = document.createElement('ul');

            list.className = 'unstyled category-tree';
            (branch.children || []).forEach(function (child) {
                list.appendChild(createDirectory(child, renderDescendants || child.selected, renderDescendants));
            });
            (branch.articles || []).forEach(function (post) {
                list.appendChild(createFile(post));
            });
            return list;
        }

        function renderDirectoryChildren(directory, renderDescendants) {
            var branch = getBranch(directory);

            if (!branch || directory.querySelector(':scope > ul.category-tree') || !nodeHasChildren(branch)) return;
            directory.appendChild(createTree(branch, renderDescendants));
        }

        function createDirectory(branch, expanded, renderDescendants) {
            var item = document.createElement('li');
            var link = document.createElement('a');

            item.className = 'directory';
            setBranchData(item, branch);
            link.href = '#';
            link.setAttribute('data-role', 'directory');
            link.setAttribute('aria-expanded', 'false');
            link.appendChild(createIcon('fa-solid fa-folder'));
            link.appendChild(document.createTextNode(' ' + (branch.name || '')));
            item.appendChild(link);

            if (expanded || renderDescendants) renderDirectoryChildren(item, renderDescendants);
            setDirectory(item, expanded);
            return item;
        }

        function renderTree(renderDescendants) {
            if (!body || !loadedTree) return;

            body.innerHTML = '';
            body.appendChild(createTree(loadedTree, renderDescendants));
            removeLoadingState();
            renderedTree = true;
        }

        function materializeAll() {
            if (!renderedTree) {
                renderTree(true);
                return;
            }

            categories.querySelectorAll('li.directory').forEach(function (directory) {
                renderDirectoryChildren(directory, true);
            });
        }

        function loadTree() {
            if (loadedTree) return Promise.resolve(loadedTree);
            if (loadingPromise) return loadingPromise;
            if (!external || !treeSource || !window.fetch) {
                showFallback();
                return Promise.resolve(null);
            }

            if (body) body.setAttribute('aria-busy', 'true');
            loadingPromise = fetch(treeSource, { credentials: 'same-origin' })
                .then(function (response) {
                    if (!response.ok) throw new Error('Failed to load category tree.');
                    return response.json();
                })
                .then(function (payload) {
                    loadedTree = payload.tree || payload;
                    markSelected(loadedTree);
                    return loadedTree;
                })
                .catch(function () {
                    showFallback();
                    return null;
                });

            return loadingPromise;
        }

        function ensureTree(renderDescendants) {
            if (!external) return Promise.resolve();

            return loadTree().then(function (tree) {
                if (!tree) return;
                if (!renderedTree) {
                    renderTree(renderDescendants);
                } else if (renderDescendants) {
                    materializeAll();
                }
            });
        }

        function setDirectory(directory, expanded) {
            var link = directory.querySelector(':scope > a[data-role="directory"]');
            var icon = link && link.querySelector('.fa-solid, .fa-regular, .fa-brands');

            directory.classList.toggle('open', expanded);
            if (link) link.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            setFolderIcon(icon, expanded);
        }

        function setBranch(directoryLink, expanded, includeChildren) {
            var directory = directoryLink.closest('li.directory');
            var branches;

            if (!directory) return;
            if (includeChildren) renderDirectoryChildren(directory, true);
            if (expanded) renderDirectoryChildren(directory, false);
            branches = includeChildren ? directory.querySelectorAll('li.directory') : [];
            setDirectory(directory, expanded);
            branches.forEach(function (branch) {
                setDirectory(branch, expanded);
            });
        }

        categories.addEventListener('click', function (event) {
            var directoryLink = event.target.closest('a[data-role="directory"]');
            var allExpandLink = event.target.closest('#allExpand');
            var allIcon;
            var shouldExpandAll;

            if (external && event.target.closest('.widget-mobile-toggle')) {
                ensureTree(false);
                return;
            }

            if (directoryLink) {
                event.preventDefault();
                ensureTree(false).then(function () {
                    var directory = directoryLink.closest('li.directory');
                    setBranch(directoryLink, !directory.classList.contains('open'), false);
                });
                return;
            }

            if (!allExpandLink) return;
            event.preventDefault();
            ensureTree(true).then(function () {
                allIcon = allExpandLink.querySelector('.fa-solid, .fa-regular, .fa-brands');
                shouldExpandAll = allIcon && allIcon.classList.contains(iconAllExpandClass);
                if (shouldExpandAll) materializeAll();
                categories.querySelectorAll('li.directory').forEach(function (directory) {
                    setDirectory(directory, shouldExpandAll);
                });
                setAllIcon(allIcon, shouldExpandAll);
            });
        });

        categories.addEventListener('contextmenu', function (event) {
            var directoryLink = event.target.closest('a[data-role="directory"]');

            if (!directoryLink) return;
            event.preventDefault();
            ensureTree(false).then(function () {
                setBranch(directoryLink, !directoryLink.closest('li.directory').classList.contains('open'), true);
            });
        });

        if (!external) return;

        if (categories.getAttribute('data-expand-all') === 'true') {
            ensureTree(true);
        } else if (!window.matchMedia || !window.matchMedia('(max-width: 799px)').matches) {
            if (window.requestIdleCallback) {
                window.requestIdleCallback(function () {
                    ensureTree(false);
                }, { timeout: 1200 });
            } else {
                window.setTimeout(function () {
                    ensureTree(false);
                }, 100);
            }
        }
    }

    ready(function () {
        setupImages();
        setupLightbox();
        setupProfileCard();
        setupMobileMenu();
        setupMobileWidgets();
        setupHighlightClasses();
        setupCodeCopy();
        setupToTop();
        setupTaskLists();
        setupCategoryTree();
    });
})();
