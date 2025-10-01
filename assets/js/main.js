(function() {
  "use strict";

  /**
   * Memberikan class .scrolled pada body saat halaman di-scroll
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader || !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }
  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Tombol Scroll Top
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  
  if (scrollTop) {
    scrollTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

})();

/**
 * Kode untuk Kontrol Manual Kartu Pencacah (di home.html)
 */
document.addEventListener('DOMContentLoaded', function() {

  const powerButton = document.getElementById('powerButton');
  const bladeIcon = document.getElementById('bladeIcon');
  const chopperStatus = document.getElementById('chopperStatus');
  const chopperControl = document.getElementById('chopper-control');
  
  // Pastikan elemen-elemen ini ada sebelum menambahkan event listener
  // untuk menghindari error di index.html
  if (powerButton && bladeIcon && chopperStatus && chopperControl) {
    chopperControl.addEventListener('click', function() {
        const isOff = powerButton.classList.contains('off');

        if (isOff) {
            powerButton.classList.remove('off');
            powerButton.classList.add('on');
            bladeIcon.classList.add('rotate');
            chopperStatus.textContent = 'Hidup';
        } else {
            powerButton.classList.remove('on');
            powerButton.classList.add('off');
            bladeIcon.classList.remove('rotate');
            chopperStatus.textContent = 'Mati';
        }
    });
  }
});