import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty">
      <h1>هذه الحكاية غير موجودة.</h1>
      <Link className="button" href="/">
        ارجع للقصص
      </Link>
    </div>
  );
}
