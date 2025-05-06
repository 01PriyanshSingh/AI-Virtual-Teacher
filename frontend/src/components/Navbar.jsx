const Navbar = () => {
  return (
    <nav className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 text-white shadow-xl py-4 px-6 fixed w-full top-0 left-0 z-50 transition-all duration-500 ease-in-out">
      <div className="max-w-7xl mx-auto flex justify-center items-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-widest text-white drop-shadow-sm hover:scale-105 transition-transform duration-300">
          AI Virtual Teacher
        </h1>
      </div>
    </nav>
  );
};

export default Navbar;
