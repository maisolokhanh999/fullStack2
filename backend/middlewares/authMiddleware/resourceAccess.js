import Reservation from "../../model/reservation.js";
import Invoice from "../../model/invoice.js";
import InvoiceDetail from "../../model/invoiceDetail.js";
import ReservationTable from "../../model/reservationTable.js";
import handleError from "../handleError/handleError.js";

export const isStaff = (user) => ["admin", "staff"].includes(user?.role);
export const owns = (user, owner) => Boolean(user?._id && owner && String(owner._id || owner) === String(user._id));

// Staff can operate across customers. Customer reads/writes require ownership.
const guard = (load) => async (req, res, next) => {
  try {
    const owner = await load(req);
    if (owner === undefined) return res.status(404).json({ success: false, message: "Không tìm thấy dữ liệu" });
    if (!isStaff(req.user) && !owns(req.user, owner)) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập dữ liệu này" });
    }
    next();
  } catch (error) { handleError(res, error); }
};

export const reservationAccess = guard(async (req) => {
  const doc = await Reservation.findById(req.params.reservationId || req.params.id || req.body?.reservationId);
  return doc ? doc.bookedBy : undefined;
});
export const invoiceAccess = guard(async (req) => {
  const doc = await Invoice.findById(req.params.invoiceId || req.params.id);
  return doc ? doc.userId : undefined;
});
export const detailAccess = guard(async (req) => {
  const detail = await InvoiceDetail.findById(req.params.id);
  const doc = detail && await Invoice.findById(detail.invoiceId);
  return doc ? doc.userId : undefined;
});
export const assignmentAccess = guard(async (req) => {
  const assignment = await ReservationTable.findById(req.params.id);
  const doc = assignment && await Reservation.findById(assignment.reservationId);
  return doc ? doc.bookedBy : undefined;
});
