import * as _ from 'lodash';
import React from 'react';

export const multipleColumnSelection = (e) => {

    if (e.shiftKey && e.target.tagName === 'INPUT') {
        let parents = e.path;
        let targetEl = undefined;

        for (let i = 0; i < parents.length; i++) {
            let el = parents[i];
            if (el.classList && el.classList.contains('ag-virtual-list-item') && el.getAttribute('aria-label').includes('Колонка') 
                && el.getAttribute('aria-level') == 3) {
                    targetEl = el;
                }
        }

        if (targetEl) {
            let columnName = targetEl.getAttribute('aria-label');
            let isChecked = e.target.checked;

            let parent = targetEl?.parentNode ?? undefined;

            if (parent) {
                let grandFather = parent?.parentNode ?? undefined;

                if (grandFather) {
                    grandFather.style.height = '20000vh';

                    let children = parent.children;

                    for (let i = 0; i < children.length; i++) {
                        let child = children[i];
                        if (child.classList && child.classList.contains('ag-virtual-list-item') && child.getAttribute('aria-label').includes(columnName) 
                            && child.getAttribute('aria-level') == 3) {
                            let inputCheck = child.getElementsByTagName('input')[0];
                            if (inputCheck.checked !== isChecked) child.getElementsByTagName('input')[0].click();
                        }}

                    grandFather.style.height = '';
                }
            }
        }
    }
}