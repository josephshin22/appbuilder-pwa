const seps = '.?!:;,';
const seprgx = /(\.|\?|!|:|;|,|')/g;
const subc = 'abcdefghijklmnopqrstuvwxyz';

export const renderDoc = (mainSeq, root) => {
    if (!root || !mainSeq?.blocks?.length) return;
    root.replaceChildren(); //clear current blocks from root

    const grafts = [];

    const renderSequence = (seq, parent) => {
        for (const block of seq.blocks) {
            renderBlock(block, parent);
        }
        // process poetry here, since it spans multiple blocks
        const poetryBlocks = Array.from(parent.getElementsByTagName('div')).filter(
            (e) => e.classList.contains('q') || e.classList.contains('q2')
        );
        const content = poetryBlocks.map((e) => e.innerHTML);
        let v = '0';
        let phraseI = 0;
        for (let i = 0; i < poetryBlocks.length; i++) {
            poetryBlocks[i].replaceChildren();
            let inner = content[i].split(/(_\{verse-[0-9]+\}_)/);
            if (inner.length === 3) {
                v = inner[1].replace(/(_|\{|\}|verse-)/g, '');
                phraseI = 0;
                const head = [`${inner[0]}<span class="v">${v}</span><span class="vsp"></span>`];
                let tail = inner[2].split(seprgx);
                for (let i = 1; i < tail.length; i += 2) {
                    tail[i - 1] += tail[i];
                }
                tail = tail.filter((s) => s.length > 0 && (s.length > 1 || !s.match(seprgx)));
                head[0] += tail[0];
                tail.shift();
                inner = head.concat(tail);
            } else {
                inner = inner[0].split(seprgx);
                for (let i = 1; i < inner.length; i += 2) {
                    inner[i - 1] += inner[i];
                }
                inner = inner.filter((s) => s.length > 0 && (s.length > 1 || !s.match(seprgx)));
            }

            inner = handleOrphanChars(inner);

            // shift grafts at start of phrase to end of next phrase
            for (let j = 1; j < inner.length; j++) {
                const m = inner[j].match(/^_\{graft-[0-9]\}_/);
                if (m) {
                    inner[j - 1] += m[0];
                    inner[j] = inner[j].replace(m, '');
                }
            }

            console.log(inner);

            //handle phrases
            renderPhrases(
                inner,
                poetryBlocks[i],
                inner.map((e) => {
                    const s = v + subc.charAt(phraseI);
                    phraseI++;
                    return s;
                })
            );
        }
        // handle orphaned blocks
        const orphanedBlocks = Array.from(parent.getElementsByClassName('unprocessed'));
        for (let i = 0; i < orphanedBlocks.length; i++) {
            let inner = orphanedBlocks[i].innerHTML.split(seprgx);
            for (let i = 1; i < inner.length; i += 2) {
                inner[i - 1] += inner[i];
            }
            inner = inner.filter(
                (s) => s.length > 0 && (s.length > 1 || (!s.match(seprgx) && !s.match(/^\s+$/)))
            );

            orphanedBlocks[i].replaceChildren();
            orphanedBlocks[i].id = 'current';

            const v = Array.from(parent.getElementsByTagName('div')).filter(
                (e, i, arr) => arr[i + 2]?.id === 'current'
            )[0].id;
            const n = v.split(/[a-z]+/)[0];
            const p = subc.indexOf(v.split(/[0-9]+/)[1]) + 1;
            renderPhrases(
                inner,
                orphanedBlocks[i],
                inner.map((e, i) => n + subc.charAt(p + i))
            );
        }
    };

    const renderGraft = (graft) => {
        grafts.push(graft);
        return '_{graft-' + (grafts.length - 1) + '}_';
    };

    const handleOrphanChars = (arr) => {
        for (let i = 0; i < arr.length - 1; i++) {
            const next = arr[i + 1].split('');
            const test = /[^_a-z\s]/i;
            let c = next.shift();
            while (c && c.match(test)) {
                arr[i] += c;
                c = next.shift();
            }
            if (c) {
                next.unshift(c);
                arr[i + 1] = next.join('');
            } else {
                arr.splice(i + 1, 1);
                i--;
            }
        }
        return arr;
    };

    const renderPhrases = (phrases, parent, ids) => {
        for (let i = 0; i < phrases.length; i++) {
            const phrase = document.createElement('div');
            phrase.id = ids[i];
            phrase.classList.add('txs', 'seltxt');

            phrases[i] = phrases[i].replace(/(_\{graft-[0-9]+\}_)/g, (m) => {
                return `<span id="${m.replace(/(_|\{|\})/, '')}">${m}</span>`;
            });

            phrase.innerHTML = phrases[i];
            phrase.getElementsByClassName('vsp').item(0)?.append('\xA0');

            parent.append(phrase);
        }
    };

    const renderBlock = (block, parent) => {
        if (block.type === 'graft') {
            const s = renderGraft(block.sequence);
            parent.innerHTML += `<span id="${s.replace(/(_|\{|\})/g, '')}">${s}</span>`;
        } else if (block.type === 'paragraph') {
            const div = document.createElement('div');
            const subtype = block.subtype.split(':')[1];
            div.classList.add(subtype);
            for (const content of block.content) {
                renderContent(content, div, subtype);
            }
            // process non poetry blocks
            if (subtype === 'p') {
                const content = Array.from(div.getElementsByTagName('div'));
                div.replaceChildren();
                for (const el of content) {
                    let inner = el.innerHTML.split(seprgx);
                    el.replaceChildren();

                    for (let i = 1; i < inner.length; i += 2) {
                        inner[i - 1] += inner[i];
                    }

                    inner = inner.filter((s) => s.length > 0 && (s.length > 1 || !s.match(seprgx)));

                    inner = handleOrphanChars(inner);

                    let v = inner[0].match(/_\{verse-[0-9]+\}_/);
                    if (v) {
                        v = Array.from(v)[0].replace(/(_|\{|\}|verse-)/g, '');
                    }

                    if (v) {
                        for (let i = 1; i < inner.length; i++) {
                            let s = inner[i].split(/(_\{graft-[0-9]+\}_)/);
                            if (s.length > 1) {
                                inner[i - 1] += `${s[1]}`;
                                inner[i] = s[2];
                            }
                        }

                        if (v) {
                            const s = inner[0].replace(/_\{verse-[0-9]+\}_/, '');
                            inner[0] = `<span class="v">${v}</span><span class="vsp"></span>${s}`;
                        }

                        //handle phrases
                        renderPhrases(
                            inner,
                            div,
                            inner.length > 1 ? inner.map((e, i) => v + subc.charAt(i)) : [v]
                        );
                    } else {
                        el.innerHTML = inner.join('');
                        div.append(el);
                    }
                }
            }
            parent.append(div);
        } else {
            console.log('unknown block type: ' + block.type + ' encountered');
        }
    };

    const renderContent = (content, parent, blockType) => {
        if (!content.type) {
            parent.append(content);
        } else if (content.type === 'wrapper') {
            if (content.subtype === 'verses') {
                if (blockType === 'p') {
                    const div = document.createElement('div');
                    div.classList.add('unprocessed');
                    for (const c2 of content.content) {
                        renderContent(c2, div, blockType);
                    }
                    parent.append(div);
                } else {
                    for (const c2 of content.content) {
                        renderContent(c2, parent, blockType);
                    }
                }
            } else {
                for (const c2 of content.content) {
                    renderContent(c2, parent, blockType);
                }
            }
        } else if (content.type === 'mark') {
            if (content.subtype === 'chapter_label') {
                const div = document.createElement('div');
                div.classList.add('c-drop');
                div.append(content.atts.number);
                parent.append(div);
            } else if (content.subtype === 'verses_label') {
                parent.append(`_{verse-${content.atts.number}}_`);
            } else {
                console.log('unknown mark subtype: ' + content.subtype + ' encountered');
            }
        } else if (content.type === 'graft') {
            const s = renderGraft(content.sequence);
            parent.innerHTML += `${s}`;
        } else {
            console.log('unknown content type: ' + content.type + ' encountered');
        }
    };

    renderSequence(mainSeq, root);

    return grafts;
};