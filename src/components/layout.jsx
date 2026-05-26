export default function Layout({ account }) {
  return (
    <div className="min-h-screen sm:p-2 bg-linear-to-br from-violet-500 to-pink-400 flex justify-center">
      <div className="w-full sm:max-w-[400px] bg-white min-h-screen sm:min-h-[565px] sm:h-full h-screen shadow-xl sm:rounded">
        <nav className="bg-violet-800 p-2 w-full h-12 text-amber-50">
          {account}
        </nav>
      </div>
    </div>
  );
}
