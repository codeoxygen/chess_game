import mongoose from "mongoose"

const { Schema } = mongoose

const playerSchema = new Schema({
  name: { type: String, required: true },
  uuid: { type: String, required: true },
  profileImage: { type: String, required: false },
  ready: { type: Boolean, default: false },
  winState: { type: String, default: "DEFEATED" },
})

const roomSchema = new Schema({
  gameSessionUuid: { type: String, required: true, unique: true },
  players: { type: [playerSchema], default: [] },
  createdDate: { type: Date, default: Date.now },
  gameStatus: { type: String, default: "ACTIVE" },
  gameBoard: { type: [String], default: Array(9).fill(null) },
  currentTurn: { type: String, default: "" },
  winner: { type: String, default: null },
})

roomSchema.index({ gameSessionUuid: 1 }, { unique: true })

const Room = mongoose.models.Room || mongoose.model("Room", roomSchema)

export default Room
