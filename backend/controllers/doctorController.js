import doctorModel from "../models/doctorModel.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"

const changeAvailablity = async (req, res) => {

  try {

    const { docId } = req.body
    const docData = await doctorModel.findById(docId)
    await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
    res.json({ success: true, message: 'Availablity Changed ' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }

}

const doctorList = async (req, res) => {

  try {

    const doctors = await doctorModel.find({}).select(['-password', '-email'])
    res.json({ success: true, doctors })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }

}

//API for doctor login
const loginDoctor = async (req, res) => {
  try {

    const { email, password } = req.body
    const doctor = await doctorModel.findOne({ email })

    if (!doctor) {
      return res.json({ success: false, message: 'Invalid Credentials' })
    }

    const isMatch = await bcrypt.compare(password, doctor.password)

    if (isMatch) {

      const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET)
      res.json({ success: true, token })

    } else {
      res.json({ success: false, message: 'Invalid credentials' })
    }

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
  try {

    const { docId } = req.body
    const appointments = await appointmentModel.find({ docId })

    res.json({ success: true, appointments })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
  try {

    const { docId, appointmentId } = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)

    if (appointmentData && appointmentData.docId === docId) {

      await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
      return res.json({ success: true, message: 'Appointment Completed' })

    } else {
      return res.json({ success: false, message: 'Mark Failed' })
    }

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}


// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
  try {

    const { docId, appointmentId } = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)

    if (appointmentData && appointmentData.docId === docId) {

      // await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: true,
        cancelledBy: 'doctor'
      });
      return res.json({ success: true, message: 'Appointment Cancelled' })

    } else {
      return res.json({ success: false, message: 'Cancellation Failed' })
    }

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    const { docId } = req.body;

    const appointments = await appointmentModel.find({ docId });

    // let earnings = 0;
    // appointments.forEach((item) => {
    //   if (item.isCompleted || item.payment) {
    //     earnings += item.amount;
    //   }
    // });
    let earnings = 0;

    appointments.forEach((item) => {
      // ✅ Add earnings if appointment is completed or payment is received
      if (!item.cancelled && (item.isCompleted || item.payment)) {
        earnings += item.amount;
      }

      // ❌ Deduct amount if doctor cancels after patient paid
      if (item.cancelled && item.cancelledBy === 'doctor' && item.payment) {
        earnings -= item.amount;
      }
    });


    const uniquePatientIds = new Set();
    appointments.forEach((item) => {
      uniquePatientIds.add(item.userId.toString());
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: uniquePatientIds.size,
      latestAppointments: appointments.reverse().slice(0, 5)
    };

    res.json({ success: true, dashData });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};



//API to get doctor profile for Doctor Panel
const doctorProfile = async (req, res) => {
  try {

    const { docId } = req.body
    const profileData = await doctorModel.findById(docId).select('-password')

    res.json({ success: true, profileData })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

//API to update doctor profile data from Doctor Panel
const updateDoctorProfile = async (req, res) => {
  try {

    const { docId, fees, address, available } = req.body

    await doctorModel.findByIdAndUpdate(docId, { fees, address, available })

    res.json({ success: true, message: 'Profile Updated' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}


export {
  changeAvailablity,
  doctorList,
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile
}