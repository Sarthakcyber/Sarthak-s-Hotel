const form = document.getElementById('bookingForm');
const confirmation = document.getElementById('confirmation');
const searchType = document.getElementById('searchType');
const searchResult = document.getElementById('searchResult');
const qrSection = document.getElementById('qrSection');

// Add hotel logo and heading to top of page
const logoContainer = document.createElement('div');
logoContainer.style.textAlign = 'center';
logoContainer.innerHTML = `
  <img src="https://i.postimg.cc/136G70gT/hotels-preview.png" alt="Sarthak's Hotel Logo" style="width: 120px; margin-bottom: 10px;">
  <h1 style="font-family: 'Georgia', serif; color: #fff; font-size: 2.2rem; margin: 0;">Sarthak's Hotels</h1>
  <p style="font-style: italic; margin-bottom: 20px; color: #eee;">Where Luxury Meets Comfort</p>
`;
document.body.prepend(logoContainer);

// Booking Data
const bookingData = {
  room: {
    name: "Luxury Room",
    price: 8500,
    image: "https://i.postimg.cc/CLykBPL2/room.png",
    totalRooms: 5,
    bookedDates: []
  },
  meeting: {
    name: "Meeting Room",
    price: 50000,
    image: "https://i.postimg.cc/tRsNVnds/meeting.jpg"
  },
  spa: {
    name: "Spa Session",
    price: 2000,
    image: "https://i.postimg.cc/QtcNYmtN/spa.png"
  },
  dining: {
    name: "Fine Dining",
    price: 200,
    image: "https://i.postimg.cc/LsvnxvSm/dining.png"
  },
  banquet: {
    name: "Banquet Hall",
    price: 100000,
    image: "https://i.postimg.cc/HWRvKPvX/Banquet.jpg"
  }
};

// Show booking image & price
searchType.addEventListener('change', function () {
  const type = this.value;
  if (!type) {
    searchResult.classList.add('hidden');
    searchResult.innerHTML = '';
    return;
  }
  const data = bookingData[type];
  searchResult.classList.remove('hidden');
  searchResult.innerHTML = `
    <h3>${data.name}</h3>
    <p>Price per day: <strong>₹${data.price}</strong></p>
    <img src="${data.image}" alt="${type}" />
  `;
});

// Handle Booking Submit
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const type = form.type.value;
  const data = bookingData[type];
  const guestName = form.guestName.value;
  const checkin = new Date(form.checkin.value);
  const checkout = new Date(form.checkout.value);
  const guests = form.guests.value;

  const days = Math.max((checkout - checkin) / (1000 * 60 * 60 * 24), 1);
  let totalPrice = data.price * days;
  let discount = 0;

  if (days > 3) discount += 0.10;
  const checkinDay = checkin.getDay();
  if (type === "spa" && (checkinDay === 0 || checkinDay === 6)) discount += 0.20;

  // Room availability logic
  if (type === "room") {
    const unavailable = [];
    for (let d = new Date(checkin); d <= checkout; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existing = data.bookedDates.find(b => b.date === dateStr);
      if (existing && existing.count >= data.totalRooms) {
        unavailable.push(dateStr);
      }
    }
    if (unavailable.length > 0) {
      alert(`❌ Rooms unavailable on: ${unavailable.join(', ')}. Please select other dates.`);
      return;
    }

    // Reserve rooms
    for (let d = new Date(checkin); d <= checkout; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existing = data.bookedDates.find(b => b.date === dateStr);
      if (existing) {
        existing.count++;
      } else {
        data.bookedDates.push({ date: dateStr, count: 1 });
      }
    }
  }

  const discountAmount = totalPrice * discount;
  const finalPrice = totalPrice - discountAmount;

  // Show on-screen confirmation
  confirmation.classList.remove('hidden');
  confirmation.innerHTML = `
    ✅ Booking Created!<br>
    Guest Name: <strong>${guestName}</strong><br>
    Type: <strong>${data.name}</strong><br>
    From: <strong>${form.checkin.value}</strong> to <strong>${form.checkout.value}</strong><br>
    Guests: <strong>${guests}</strong><br>
    Duration: <strong>${days}</strong> day(s)<br>
    Total: ₹${totalPrice}<br>
    Discount Applied: ₹${discountAmount.toFixed(2)}<br>
    <strong>Final Price: ₹${finalPrice.toFixed(2)}</strong><br><br>
    Please scan the QR below to complete payment.<br><br>
    <button id="downloadBtn">📄 Download PDF Receipt</button>
  `;

  qrSection.classList.remove('hidden');
  alert("✅ Booking successful! Please scan the QR to complete payment.");

  // PDF Receipt
  document.getElementById("downloadBtn").addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const logoURL = "https://i.postimg.cc/136G70gT/hotels-preview.png";
    const qrURL = "https://i.postimg.cc/T332cNPj/qr.jpg";

    const toBase64 = (url) =>
      fetch(url)
        .then((res) => res.blob())
        .then(blob => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }));

    const [logoImg, qrImg] = await Promise.all([toBase64(logoURL), toBase64(qrURL)]);

    doc.addImage(logoImg, "PNG", 65, 10, 80, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Sarthak's Hotels - Booking Receipt", 20, 50);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    let y = 60;
    doc.text(`Guest Name: ${guestName}`, 20, y += 10);
    doc.text(`Booking Type: ${data.name}`, 20, y += 10);
    doc.text(`Check-In: ${form.checkin.value}`, 20, y += 10);
    doc.text(`Check-Out: ${form.checkout.value}`, 20, y += 10);
    doc.text(`Guests: ${guests}`, 20, y += 10);
    doc.text(`Duration: ${days} day(s)`, 20, y += 10);
    doc.text(`Total: ₹${totalPrice}`, 20, y += 10);
    doc.text(`Discount: ₹${discountAmount.toFixed(2)}`, 20, y += 10);
    doc.text(`Final Price: ₹${finalPrice.toFixed(2)}`, 20, y += 10);
    doc.text(`UPI ID: sarthakagrawal282@okhdfcbank`, 20, y += 10);
    doc.text(`Date: ${new Date().toLocaleString()}`, 20, y += 15);

    doc.addImage(qrImg, "JPEG", 70, y, 60, 60);
    y += 70;

    doc.setFont("helvetica", "italic");
    doc.text("Thank you for choosing Sarthak's Hotels!", 40, y);

    doc.save("Sarthak_Hotel_Receipt.pdf");
  });
});
