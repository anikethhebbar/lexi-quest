class Node {
    constructor(t) {
      this.t = t; // Minimum degree
      this.keys = [];
      this.children = [];
      this.isLeaf = true;
    }
  }
  
  class BTree {
    constructor(t) {
      this.root = null;
      this.t = t; // Minimum degree
    }
  
    // B-tree insertion function
    insert(key) {
      if (this.root === null) {
        this.root = new Node(this.t);
        this.root.keys.push(key);
        return;
      }
  
      if (this.root.keys.length === 2 * this.t - 1) {
        const newRoot = new Node(this.t);
        newRoot.children.push(this.root);
        this.splitChild(newRoot, 0);
        this.root = newRoot;
      }
  
      this.insertNonFull(this.root, key);
    }
  
    // Insert into a non-full node
    insertNonFull(node, key) {
      let i = node.keys.length - 1;
  
      if (node.isLeaf) {
        while (i >= 0 && key < node.keys[i]) {
          node.keys[i + 1] = node.keys[i];
          i--;
        }
        node.keys[i + 1] = key;
      } else {
        while (i >= 0 && key < node.keys[i]) {
          i--;
        }
        i++;
  
        if (node.children[i].keys.length === 2 * this.t - 1) {
          this.splitChild(node, i);
          if (key > node.keys[i]) {
            i++;
          }
        }
        this.insertNonFull(node.children[i], key);
      }
    }
  
    // Split child function
    splitChild(parent, i) {
      const t = this.t;
      const child = parent.children[i];
      const newChild = new Node(t);
  
      parent.keys.splice(i, 0, child.keys[t - 1]);
      parent.children.splice(i + 1, 0, newChild);
  
      newChild.keys = child.keys.splice(t, t - 1);
      if (!child.isLeaf) {
        newChild.children = child.children.splice(t, t);
        newChild.isLeaf = false;
      }
    }
  
    // B-tree search function
    search(key) {
      return this.searchNode(this.root, key);
    }
  
    searchNode(node, key) {
      if (!node) return false;
  
      let i = 0;
      while (i < node.keys.length && key > node.keys[i]) {
        i++;
      }
  
      if (i < node.keys.length && key === node.keys[i]) {
        return true;
      }
  
      if (node.isLeaf) {
        return false;
      }
  
      return this.searchNode(node.children[i], key);
    }
  }
  
  export default BTree;