export default function About() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-4xl font-bold mb-6">About Us</h1>
      <p className="text-lg text-gray-700 mb-4">
        This is a public page demonstrating Next.js authentication with AWS
        Cognito and Auth.js.
      </p>
      <p className="text-lg text-gray-700">
        This page is accessible to everyone without authentication.
      </p>
    </div>
  );
}
