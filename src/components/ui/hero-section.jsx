'use client';

import React from 'react';

export default function HeroSection() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);


  React.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    function onClickOutside(e) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target)) return;
      setMenuOpen(false);
    }

    if (menuOpen) {
      document.addEventListener('keydown', onKey);
      document.addEventListener('click', onClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClickOutside);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
        * { font-family: 'Poppins', sans-serif; }
      `}</style>
      <section
        className="bg-[url('https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/hero/gridBackground.png')] w-full bg-no-repeat bg-cover bg-center text-sm pb-44">
       

        <div
          className="flex items-center gap-2 border border-slate-300 hover:border-slate-400/70 rounded-full w-max mx-auto px-4 py-2">
          <span>New announcement on your inbox</span>
          <button className="flex items-center gap-1 font-medium">
            <span>Read more</span>
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden>
              <path
                d="M3.959 9.5h11.083m0 0L9.501 3.958M15.042 9.5l-5.541 5.54"
                stroke="#050040"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <h5
          className="text-4xl md:text-7xl font-medium max-w-[850px] text-center mx-auto mt-8">
          Build apps faster with ui components
        </h5>

        <p
          className="text-sm md:text-base mx-auto max-w-2xl text-center mt-6 max-md:px-2">
          Build sleek, consistent UIs without wrestling with design systems, our components handle the heavy lifting so you can ship faster.
        </p>

        <div className="mx-auto w-full flex items-center justify-center gap-3 mt-4">
          <button
            className="bg-slate-800 hover:bg-black text-white px-6 py-3 rounded-full font-medium transition">
            Get Started
          </button>
          <button
            className="flex items-center gap-2 border border-slate-300 hover:bg-slate-200/30 rounded-full px-6 py-3">
            <span>Learn More</span>
            <svg
              width="6"
              height="8"
              viewBox="0 0 6 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden>
              <path
                d="M1.25.5 4.75 4l-3.5 3.5"
                stroke="#050040"
                strokeOpacity=".4"
                strokeLinecap="round"
                strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </section>
    </>
  );
}
