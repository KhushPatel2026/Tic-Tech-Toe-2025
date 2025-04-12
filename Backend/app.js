require('dotenv').config();
const express=require('express'),cors=require('cors'),mongoose=require('mongoose'),cookieParser=require('cookie-parser'),session=require('express-session'),passport=require('./utils/passportConfig'),http=require('http'),socketIo=require('socket.io'),authRoutes=require('./routes/authRoutes'),sessionRoutes=require('./routes/sessionRoutes'),feedbackRoutes=require('./routes/feedbackRoutes'),socialAuthRoutes=require('./Routes/socialAuthRoutes'),Session=require('./model/Session'),Message=require('./model/Message'),{RtcTokenBuilder,RtcRole}=require('agora-access-token'),checkAbusiveWords=require('./Utils/abusiveWords'),{GoogleGenerativeAI}=require('@google/generative-ai');
const app=express(),server=http.createServer(app),io=socketIo(server,{cors:{origin:'http://localhost:5173',methods:['GET','POST'],credentials:true},transports:['websocket','polling'],pingTimeout:60000,pingInterval:25000});
app.use(cors({origin:'http://localhost:5173',credentials:true}));
app.use(express.json());
app.use(cookieParser());
app.use(session({secret:process.env.JWT_SECRET,resave:false,saveUninitialized:false,cookie:{secure:false,maxAge:3600000}}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect(process.env.MONGO_URL).then(()=>console.log('MongoDB connection open')).catch(err=>{console.error('MongoDB connection error:',err);process.exit(1);});
app.use('/api/auth',authRoutes);
app.use('/api/sessions',sessionRoutes);
app.use('/api/feedback',feedbackRoutes);
app.use('/auth',socialAuthRoutes);
server.on('error',error=>console.error('Server error:',error));

const activeRooms=new Map();

io.on('connection',socket=>{
  console.log('New socket connection:',socket.id);
  let currentRoom=null;
  
  socket.on('join-room',async({sessionId,userId,role})=>{
    try{
      const session=await Session.findById(sessionId);
      if(!session) return socket.emit('error','Session not found');
      const isAuthorized=session.moderatorId.toString()===userId||session.participants.some(p=>p.toString()===userId)||session.evaluators.some(e=>e.toString()===userId);
      if(!isAuthorized) return socket.emit('error','Not authorized');
      
      socket.join(sessionId);
      currentRoom=sessionId;
      
      if(!activeRooms.has(sessionId)) activeRooms.set(sessionId,new Set());
      activeRooms.get(sessionId).add(userId);
      
      console.log('User joined room:',{sessionId,userId,role});
      socket.to(sessionId).emit('user-joined',{userId,role});
      
      if(session.isAIPractice&&role==='Participant'){
        const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY),model=genAI.getGenerativeModel({model:'gemini-1.5-flash'}),result=await model.generateContent('Generate an interview question for a practice session.');
        io.to(sessionId).emit('ai-message',{username:'AI Moderator',message:result.response.text(),timestamp:new Date()});
      }
    }catch(error){console.error('Join room error:',error);socket.emit('error','Failed to join room');}
  });
  
  socket.on('send-message',async({sessionId,userId,username,role,message})=>{
    try{
      console.log('Received send-message:',{sessionId,userId,username,role,message});
      const session=await Session.findById(sessionId);
      if(!session) return socket.emit('error','Session not found');
      if(checkAbusiveWords(message)){
        session.participants=session.participants.filter(id=>id.toString()!==userId);
        await session.save();
        socket.leave(sessionId);
        socket.emit('error','Removed due to abusive language');
        io.to(sessionId).emit('user-removed',{userId,reason:'Abusive language'});
        return;
      }
      const chatMessage=new Message({sessionId,userId,username,role,message});
      const savedMessage=await chatMessage.save();
      session.chatHistory.push(savedMessage._id);
      await session.save();
      io.to(sessionId).emit('new-message',{userId,username,role,message,timestamp:savedMessage.timestamp});
      if(session.isAIPractice&&role==='Participant'){
        const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY),model=genAI.getGenerativeModel({model:'gemini-1.5-flash'}),result=await model.generateContent(`Respond to this interview answer: "${message}" with a follow-up question or feedback.`);
        io.to(sessionId).emit('ai-message',{username:'AI Moderator',message:result.response.text(),timestamp:new Date()});
      }
    }catch(error){console.error('Send message error:',error);socket.emit('error','Failed to send message');}
  });
  
  socket.on('join-voice-room',async({sessionId,userId})=>{
    try{
      const session=await Session.findById(sessionId);
      if(!session) return socket.emit('error','Session not found');
      const isAuthorized=session.moderatorId.toString()===userId||session.participants.some(p=>p.toString()===userId)||session.evaluators.some(e=>e.toString()===userId);
      if(!isAuthorized) return socket.emit('error','Not authorized');
      
      const channelName=sessionId.toString();
      const uid=parseInt(userId.substr(-6).replace(/\D/g,''),10)||Math.floor(Math.random()*999000)+1000;
      const token=RtcTokenBuilder.buildTokenWithUid(process.env.AGORA_APP_ID,process.env.AGORA_APP_CERTIFICATE,channelName,uid,RtcRole.PUBLISHER,Math.floor(Date.now()/1000)+86400);
      
      console.log('Generated Agora token:',{channel:channelName,uid,token});
      socket.join(`${sessionId}-voice`);
      socket.userId=userId;
      socket.voiceRoomId=sessionId;
      socket.emit('voice-token',{token,channel:channelName,uid});
      io.to(sessionId).emit('voice-user-joined',{userId});
    }catch(error){console.error('Join voice room error:',error);socket.emit('error','Failed to join voice room');}
  });
  
  socket.on('leave-voice-room',({sessionId,userId})=>{
    console.log('Leave voice room:',{sessionId,userId});
    if(socket.voiceRoomId===sessionId){
      socket.leave(`${sessionId}-voice`);
      socket.voiceRoomId=null;
      io.to(sessionId).emit('voice-user-left',{userId});
    }
  });
  
  socket.on('leave-room',({sessionId})=>{
    console.log('Leave room:',{sessionId,socketId:socket.id});
    if(socket.voiceRoomId){
      socket.leave(`${socket.voiceRoomId}-voice`);
      socket.voiceRoomId=null;
    }
    socket.leave(sessionId);
    if(activeRooms.has(sessionId)&&socket.userId){
      activeRooms.get(sessionId).delete(socket.userId);
      if(activeRooms.get(sessionId).size===0) activeRooms.delete(sessionId);
    }
    currentRoom=null;
    io.to(sessionId).emit('user-left',{userId:socket.userId});
  });
  
  socket.on('end-session',async({sessionId})=>{
    try{
      const session=await Session.findById(sessionId);
      if(session&&session.status==='active'){
        session.status='ended';
        await session.save();
        io.to(sessionId).emit('session-ended');
      }
    }catch(error){console.error('End session error:',error);socket.emit('error','Failed to end session');}
  });
  
  socket.on('ai-response',async({sessionId,userId,response})=>{
    try{
      if(checkAbusiveWords(response)) return socket.emit('error','Inappropriate response detected');
      const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY),model=genAI.getGenerativeModel({model:'gemini-1.5-flash'}),result=await model.generateContent(`Respond to this interview answer: "${response}" with a follow-up question or feedback.`);
      io.to(sessionId).emit('ai-message',{username:'AI Moderator',message:result.response.text(),timestamp:new Date()});
    }catch(error){console.error('AI response error:',error);socket.emit('error','Failed to process AI response');}
  });
  
  socket.on('disconnect',()=>{
    console.log('Socket disconnected:',socket.id);
    if(currentRoom){
      socket.to(currentRoom).emit('user-left',{userId:socket.userId});
      if(socket.voiceRoomId){
        socket.to(socket.voiceRoomId).emit('voice-user-left',{userId:socket.userId});
      }
      if(activeRooms.has(currentRoom)&&socket.userId){
        activeRooms.get(currentRoom).delete(socket.userId);
        if(activeRooms.get(currentRoom).size===0) activeRooms.delete(currentRoom);
      }
    }
  });
});

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log(`Server started on port ${PORT}`));
process.on('SIGTERM',()=>{console.log('SIGTERM received. Closing server...');server.close(()=>{mongoose.connection.close();console.log('Server closed');process.exit(0);});});
process.on('uncaughtException',error=>console.error('Uncaught Exception:',error));
process.on('unhandledRejection',reason=>console.error('Unhandled Rejection:',reason));