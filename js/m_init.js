document.addEventListener('DOMContentLoaded', function() {
    const elems = document.querySelectorAll('.modal');
    const options = {dismissible: false, opacity: 0.7};
    const instances = M.Modal.init(elems, options);
  });