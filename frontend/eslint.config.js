export default function Register() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-slate-400 text-center mb-6">Join SecureVault</p>

        <form className="space-y-4">
          <input type="email" placeholder="Email" className="w-full p-3 rounded bg-slate-800" />
          <input type="password" placeholder="Password" className="w-full p-3 rounded bg-slate-800" />
          <input type="password" placeholder="Confirm Password" className="w-full p-3 rounded bg-slate-800" />
          <button className="w-full bg-green-600 p-3 rounded hover:bg-green-700">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}