import { getLoggedUser } from "@/lib/auth";
import db from "@/lib/connectDb";
import Notification from "@/models/notificationModel";

export async function GET(req) {
  await db();

  try {
    const user = await getLoggedUser();
    if (!user || !user._id) {
       return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const notifications = await Notification.find({ userId: user._id })
      .populate({ path: "senderId", select: "username name avatar", strictPopulate: false })
      .sort({ createdAt: -1 })
      .limit(50); // Fetch top 50 notifications

    return new Response(JSON.stringify(notifications), { status: 200 });

  } catch (error) {
    console.error("Fetch Notifications Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch notifications" }), { status: 500 });
  }
}

export async function PUT(req) {
  await db();

  try {
    const user = await getLoggedUser();
    if (!user || !user._id) {
       return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
       await Notification.updateMany({ userId: user._id, read: false }, { read: true });
       return new Response(JSON.stringify({ message: "All notifications marked as read." }), { status: 200 });
    }

    if (!notificationId) {
        return new Response(JSON.stringify({ error: "No notification specified." }), { status: 400 });
    }

    const notif = await Notification.findOneAndUpdate(
       { _id: notificationId, userId: user._id },
       { read: true },
       { new: true }
    );

    if (!notif) {
        return new Response(JSON.stringify({ error: "Notification not found." }), { status: 404 });
    }

    return new Response(JSON.stringify(notif), { status: 200 });
  } catch (error) {
    console.error("Update Notification Error:", error);
    return new Response(JSON.stringify({ error: "Failed to update notification status" }), { status: 500 });
  }
}

export async function DELETE(req) {
  await db();

  try {
    const user = await getLoggedUser();
    if (!user || !user._id) {
       return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
        return new Response(JSON.stringify({ error: "No notification specified." }), { status: 400 });
    }

    const notif = await Notification.findOneAndDelete({ _id: notificationId, userId: user._id });

    if (!notif) {
        return new Response(JSON.stringify({ error: "Notification not found." }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: "Notification deleted successfully." }), { status: 200 });
  } catch (error) {
    console.error("Delete Notification Error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete notification" }), { status: 500 });
  }
}
