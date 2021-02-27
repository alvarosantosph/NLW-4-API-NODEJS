import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import { SurveysRepository } from "../repositories/SurveysRepository";
import { SurveysUserRepository } from "../repositories/SurveysUserRepository";
import { UseRepository } from "../repositories/UserRepository";
import SendMailService from "../services/SendMailService";
import { resolve } from "path";
import { AppError } from "../errors/AppError";

class SendMailController {
    async execute(request: Request, response: Response) {
        const { email, survey_id } = request.body;

        const userRepository = getCustomRepository(UseRepository);
        const surveysRepository = getCustomRepository(SurveysRepository);
        const surveysUserRepository = getCustomRepository(SurveysUserRepository);

        const user = await userRepository.findOne({email});

        if (!user) {

            throw new AppError("User dos not exists!");

            // return response.status(400).json({
            //     error: "User dos not exists!",
            // });
        }

        const survey = await surveysRepository.findOne({id: survey_id});

        if (!survey) {

            throw new AppError("Survey dos not exists!");

            // return response.status(400).json({
            //     error: "Survey dos not exists!",
            // });
        }

        const npsPath = resolve(__dirname, "../", "views", "emails", "npsMail.hbs");

        const surveyUserAlreadyExists = await surveysUserRepository.findOne({
            //where: [{user_id: user.id,}, {value: null}], // OR
            where: { user_id: user.id, value: null }, //AND
            relations: ["user", "survey"],
        });

        const variables = {
            name: user.name,
            title: survey.title,
            description: survey.description,
            //user_id: user.id, 
            id: "",
            link: process.env.URL_MAIL, 
        };

        if (surveyUserAlreadyExists) {
            variables.id = surveyUserAlreadyExists.id;
            await SendMailService.execute(email, survey.title, variables, npsPath);
            return response.json(surveyUserAlreadyExists);
        }

        const surveyUser = surveysUserRepository.create({
            user_id: user.id,
            survey_id
        });

        await surveysUserRepository.save(surveyUser);

        variables.id = surveyUser.id;

        await SendMailService.execute(email, survey.title, variables, npsPath);

        return response.json(surveyUser);

    }
}

export {SendMailController };