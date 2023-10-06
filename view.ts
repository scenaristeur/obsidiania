import { ItemView, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_EXAMPLE = "example-view";

export class ExampleView extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_EXAMPLE;
    }

    getDisplayText() {
        return "Example view";
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl("h4", { text: "Example view" });
        // const list = container.createEl('ul')
        // const li = container.createEl('li')
        // list.append(li)
    }

    async updateSims(data) {
        // https://docs.obsidian.md/Plugins/User+interface/HTML+elements
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl("h4", { text: "Similarity Bob" });
    //    const div = container.createDiv({text: "hello"})
    //    div.setText(data)
       let sims = JSON.parse(data)
       const list = container.createEl('ul')

       let sortable = Object.entries(sims)
       .sort(([,a],[,b]) => b-a)
       //.reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
   
   //console.log(sortable);

   // get 5 firsts elements
    sortable = sortable.slice(0, 5);
    console.log(sortable);

       for (const [key, value] of sortable) {
        console.log(`${key}: ${value}`);
        const li = list.createEl('li')
        const encoded = encodeURI(key)
        li.innerHTML = `${key.split('.')[0]} ${value}` + "   <a href='obsidian://open?vault=obsidiania&file="+encoded+"'>Link</a>"

       // obsidian://open?vault=obsidiania&file=text%20js%202
      }


        
//         // list.appendChild(li)
//         // list.appendChild(li)
//         // list.appendChild(li)

//         function logMapElements(value, key, map) {
//             console.log(`m[${key}] = ${value}`);
//           }
          

// sims.forEach(logMapElements);
//         console.log("update sims", sims.length, sims)

//         sims.forEach(sim => {
//             console.log("sim",sim)
//             const li = list.createEl('li')
//             li.innerHTML = "hj" + sim
//             // list.appendChild(li)
//             console.log(list)
//         });

       
//         container.createDiv({ text: "hello" })

    }

    async onClose() {
        // Nothing to clean up.
    }
}